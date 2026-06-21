const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");
const { ACCIONES_AUTOSERVICIO, otorgarPuntos } = require("../puntos");

const router = express.Router();

router.use(authMiddleware);

function inicioDeMes() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}


router.get("/puntos/:usuario_id", async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    if (Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "usuario_id no válido" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El usuario no existe" });
    }

    const total = await prisma.accionPuntos.aggregate({
      _sum: { puntos: true },
      where: { usuarioId },
    });

    const mes = await prisma.accionPuntos.aggregate({
      _sum: { puntos: true },
      where: { usuarioId, creadoEn: { gte: inicioDeMes() } },
    });

    res.json({
      usuario_id: usuarioId,
      nombre: usuario.nombre,
      puntos_totales: total._sum.puntos || 0,
      puntos_este_mes: mes._sum.puntos || 0,
    });
  } catch (err) {
    console.error("Error en GET /gamificacion/puntos/:usuario_id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron obtener los puntos" });
  }
});

// GET /gamificacion/historial/:usuario_id  -> historial de puntos del usuario
router.get("/historial/:usuario_id", async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    if (Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "usuario_id no válido" });
    }

    const acciones = await prisma.accionPuntos.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: "desc" },
    });

    const historial = acciones.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      puntos: a.puntos,
      creado_en: a.creadoEn,
    }));

    res.json(historial);
  } catch (err) {
    console.error("Error en GET /gamificacion/historial/:usuario_id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo obtener el historial" });
  }
});

// GET /gamificacion/ranking/:circulo_id  -> ranking del círculo familiar
router.get("/ranking/:circulo_id", async (req, res) => {
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
    const ids = miembros.map((m) => m.usuarioId);

    const sumas = await prisma.accionPuntos.groupBy({
      by: ["usuarioId"],
      _sum: { puntos: true },
      where: { usuarioId: { in: ids } },
    });
    const puntosPorUsuario = {};
    sumas.forEach((s) => {
      puntosPorUsuario[s.usuarioId] = s._sum.puntos || 0;
    });

    const badges = await prisma.usuarioBadge.findMany({
      where: { usuarioId: { in: ids } },
      include: { badge: true },
      orderBy: { obtenidoEn: "desc" },
    });
    const badgePorUsuario = {};
    badges.forEach((b) => {
      if (!badgePorUsuario[b.usuarioId]) {
        badgePorUsuario[b.usuarioId] = b.badge.nombre;
      }
    });

    const ranking = miembros
      .map((m) => ({
        usuario_id: m.usuarioId,
        nombre: m.usuario.nombre,
        puntos: puntosPorUsuario[m.usuarioId] || 0,
        badge_destacado: badgePorUsuario[m.usuarioId] || "",
      }))
      .sort((a, b) => b.puntos - a.puntos)
      .map((item, i) => ({ posicion: i + 1, ...item }));

    res.json(ranking);
  } catch (err) {
    console.error("Error en GET /gamificacion/ranking/:circulo_id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo obtener el ranking" });
  }
});

router.get("/badges/:usuario_id", async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    if (Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "usuario_id no válido" });
    }

    const usuarioBadges = await prisma.usuarioBadge.findMany({
      where: { usuarioId },
      include: { badge: true },
      orderBy: { obtenidoEn: "desc" },
    });

    const badges = usuarioBadges.map((ub) => ({
      id: ub.badge.id,
      nombre: ub.badge.nombre,
      descripcion: ub.badge.descripcion,
      icono_url: ub.badge.iconoUrl,
      obtenido_en: ub.obtenidoEn,
    }));

    res.json(badges);
  } catch (err) {
    console.error("Error en GET /gamificacion/badges/:usuario_id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron obtener los badges" });
  }
});

// POST /gamificacion/accion  -> registrar una acción de autoservicio y sumar
// puntos. Los puntos SIEMPRE se otorgan al usuario autenticado (no se pueden
// asignar a mano a otra persona) y solo se aceptan acciones de autoservicio
// como "confirmar_toma". Las demás (invitar familiar, etc.) se premian de
// forma automática desde su propio flujo.
router.post("/accion", async (req, res) => {
  try {
    const { tipo_accion } = req.body;

    if (!tipo_accion) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "tipo_accion es requerido",
      });
    }
    if (!ACCIONES_AUTOSERVICIO.includes(tipo_accion)) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "Esta acción otorga puntos automáticamente; no se puede registrar a mano",
      });
    }

    const puntos = await otorgarPuntos({ usuarioId: req.usuarioId, tipo: tipo_accion });

    const total = await prisma.accionPuntos.aggregate({
      _sum: { puntos: true },
      where: { usuarioId: req.usuarioId },
    });

    res.json({
      mensaje: "Acción registrada correctamente",
      puntos_sumados: puntos,
      puntos_totales: total._sum.puntos || 0,
    });
  } catch (err) {
    console.error("Error en POST /gamificacion/accion:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo registrar la acción" });
  }
});

module.exports = router;
