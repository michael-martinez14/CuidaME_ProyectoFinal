const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cuidame-dev-secret-cambiar";
const ROLES = ["cuidador_principal", "cuidador_secundario", "observador"];

router.use(authMiddleware);

// POST /circulos/:circulo_id/invitar  -> invitar familiar por correo
// El invitado debe ser un usuario ya registrado. Se crea su membresía como
// "pendiente" y se devuelve un token de invitación para aceptarla.
router.post("/:circulo_id/invitar", async (req, res) => {
  try {
    const circuloId = Number(req.params.circulo_id);
    if (Number.isNaN(circuloId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "circulo_id no válido" });
    }

    const { correo, rol } = req.body;
    if (!correo) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "correo es requerido" });
    }
    if (rol && !ROLES.includes(rol)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "rol no válido" });
    }

    const circulo = await prisma.circulo.findUnique({ where: { id: circuloId } });
    if (!circulo) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El círculo no existe" });
    }

    const invitado = await prisma.usuario.findUnique({ where: { correo } });
    if (!invitado) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "El correo no corresponde a un usuario registrado",
      });
    }

    const yaExiste = await prisma.miembroCirculo.findUnique({
      where: { usuarioId_circuloId: { usuarioId: invitado.id, circuloId } },
    });
    if (yaExiste) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "El usuario ya pertenece al círculo" });
    }

    const miembro = await prisma.miembroCirculo.create({
      data: {
        usuarioId: invitado.id,
        circuloId,
        rol: rol || "observador",
        estado: "pendiente",
      },
    });

    const tokenInvitacion = jwt.sign({ miembroId: miembro.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      mensaje: "Invitación enviada correctamente",
      token_invitacion: tokenInvitacion,
    });
  } catch (err) {
    console.error("Error en POST /circulos/:circulo_id/invitar:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo enviar la invitación" });
  }
});

// POST /circulos/aceptar-invitacion  -> aceptar invitación al círculo
router.post("/aceptar-invitacion", async (req, res) => {
  try {
    const { token_invitacion } = req.body;
    if (!token_invitacion) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "token_invitacion es requerido" });
    }

    let payload;
    try {
      payload = jwt.verify(token_invitacion, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "Token inválido o expirado" });
    }

    const miembro = await prisma.miembroCirculo.findUnique({ where: { id: payload.miembroId } });
    if (!miembro) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "La invitación no existe" });
    }
    if (miembro.usuarioId !== req.usuarioId) {
      return res.status(401).json({ error: "Esta invitación no es para ti" });
    }

    await prisma.miembroCirculo.update({
      where: { id: miembro.id },
      data: { estado: "activo" },
    });

    res.json({ mensaje: "Invitación aceptada, ahora eres parte del círculo" });
  } catch (err) {
    console.error("Error en POST /circulos/aceptar-invitacion:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo aceptar la invitación" });
  }
});

// GET /circulos/:circulo_id/miembros  -> listar miembros del círculo
router.get("/:circulo_id/miembros", async (req, res) => {
  try {
    const circuloId = Number(req.params.circulo_id);
    if (Number.isNaN(circuloId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "circulo_id no válido" });
    }

    const circulo = await prisma.circulo.findUnique({ where: { id: circuloId } });
    if (!circulo) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El círculo no existe" });
    }

    const miembros = await prisma.miembroCirculo.findMany({
      where: { circuloId },
      include: { usuario: true },
    });

    const respuesta = miembros.map((m) => ({
      usuario_id: m.usuarioId,
      nombre: m.usuario.nombre,
      correo: m.usuario.correo,
      rol: m.rol,
      estado: m.estado,
      puntos: m.puntos,
    }));

    res.json(respuesta);
  } catch (err) {
    console.error("Error en GET /circulos/:circulo_id/miembros:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar los miembros" });
  }
});

module.exports = router;
