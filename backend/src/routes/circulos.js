const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");
const { otorgarPuntos } = require("../puntos");

const router = express.Router();

// Acepta una invitación pendiente: marca al miembro como activo y, si se
// registró quién lo invitó, le otorga los puntos por sumar un familiar.
// Devuelve true si la invitación estaba pendiente y se aceptó.
async function aceptarMiembro(miembro) {
  if (miembro.estado !== "pendiente") return false;

  await prisma.miembroCirculo.update({
    where: { id: miembro.id },
    data: { estado: "activo" },
  });

  if (miembro.invitadoPorId) {
    await otorgarPuntos({
      usuarioId: miembro.invitadoPorId,
      tipo: "invitar_familiar",
      circuloId: miembro.circuloId,
    });
  }

  return true;
}
const JWT_SECRET = process.env.JWT_SECRET || "cuidame-dev-secret-cambiar";
const ROLES = ["cuidador_principal", "cuidador_secundario", "observador"];

router.use(authMiddleware);

// GET /circulos/invitaciones  -> invitaciones pendientes del usuario actual
router.get("/invitaciones", async (req, res) => {
  try {
    const invitaciones = await prisma.miembroCirculo.findMany({
      where: { usuarioId: req.usuarioId, estado: "pendiente" },
      include: { circulo: { include: { paciente: true } } },
      orderBy: { id: "desc" },
    });

    const respuesta = invitaciones.map((i) => ({
      miembro_id: i.id,
      circulo_id: i.circuloId,
      circulo_nombre: i.circulo.nombre,
      paciente_nombre: i.circulo.paciente ? i.circulo.paciente.nombre : null,
      rol: i.rol,
    }));

    res.json(respuesta);
  } catch (err) {
    console.error("Error en GET /circulos/invitaciones:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar las invitaciones" });
  }
});

// POST /circulos/invitaciones/:miembroId/aceptar  -> aceptar una invitación
router.post("/invitaciones/:miembroId/aceptar", async (req, res) => {
  try {
    const miembroId = Number(req.params.miembroId);
    if (Number.isNaN(miembroId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const miembro = await prisma.miembroCirculo.findUnique({ where: { id: miembroId } });
    if (!miembro || miembro.usuarioId !== req.usuarioId) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "La invitación no existe" });
    }

    await aceptarMiembro(miembro);

    res.json({ mensaje: "Invitación aceptada, ahora eres parte del círculo" });
  } catch (err) {
    console.error("Error en POST /circulos/invitaciones/:miembroId/aceptar:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo aceptar la invitación" });
  }
});

// POST /circulos/invitaciones/:miembroId/rechazar  -> rechazar una invitación
router.post("/invitaciones/:miembroId/rechazar", async (req, res) => {
  try {
    const miembroId = Number(req.params.miembroId);
    if (Number.isNaN(miembroId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const miembro = await prisma.miembroCirculo.findUnique({ where: { id: miembroId } });
    if (!miembro || miembro.usuarioId !== req.usuarioId) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "La invitación no existe" });
    }

    await prisma.miembroCirculo.delete({ where: { id: miembroId } });

    res.json({ mensaje: "Invitación rechazada" });
  } catch (err) {
    console.error("Error en POST /circulos/invitaciones/:miembroId/rechazar:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo rechazar la invitación" });
  }
});

// POST /circulos/:circulo_id/invitar  -> invitar familiar por correo
// El invitado debe ser un usuario ya registrado. Se crea su membresía como
// "pendiente"; el invitado la verá en su lista de invitaciones.
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

    if (invitado.id === req.usuarioId) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "No puedes invitarte a ti mismo" });
    }

    const yaExiste = await prisma.miembroCirculo.findUnique({
      where: { usuarioId_circuloId: { usuarioId: invitado.id, circuloId } },
    });
    if (yaExiste) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "El usuario ya pertenece al círculo o fue invitado" });
    }

    await prisma.miembroCirculo.create({
      data: {
        usuarioId: invitado.id,
        circuloId,
        rol: rol || "observador",
        estado: "pendiente",
        invitadoPorId: req.usuarioId,
      },
    });

    res.json({ mensaje: "Invitación enviada correctamente" });
  } catch (err) {
    console.error("Error en POST /circulos/:circulo_id/invitar:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo enviar la invitación" });
  }
});

// POST /circulos/aceptar-invitacion  -> aceptar con token (compatibilidad)
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

    await aceptarMiembro(miembro);

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
