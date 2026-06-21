const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();
const TIPOS = ["medicamento", "cita", "sintoma", "stock", "familiar"];

router.use(authMiddleware);

// GET /alertas?tipo=...  -> listar alertas activas (no leídas) del usuario
router.get("/", async (req, res) => {
  try {
    const { tipo } = req.query;
    if (tipo && !TIPOS.includes(tipo)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "tipo de alerta no válido" });
    }

    const where = { usuarioId: req.usuarioId, leida: false };
    if (tipo) {
      where.tipo = tipo;
    }

    const alertas = await prisma.alerta.findMany({
      where,
      orderBy: { creadaEn: "desc" },
    });

    res.json(alertas);
  } catch (err) {
    console.error("Error en GET /alertas:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar las alertas" });
  }
});

// POST /alertas  -> crear una alerta para el usuario actual.
// Evita duplicados: si ya existe una alerta no leída con el mismo tipo y
// mensaje, devuelve esa en vez de crear otra.
router.post("/", async (req, res) => {
  try {
    const { tipo, mensaje, referencia_id } = req.body;

    if (!tipo || !TIPOS.includes(tipo)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "tipo de alerta no válido" });
    }
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "mensaje es requerido" });
    }

    const existente = await prisma.alerta.findFirst({
      where: { usuarioId: req.usuarioId, tipo, mensaje, leida: false },
    });
    if (existente) {
      return res.status(200).json(existente);
    }

    const alerta = await prisma.alerta.create({
      data: {
        usuarioId: req.usuarioId,
        tipo,
        mensaje: mensaje.trim(),
        referenciaId: referencia_id != null ? Number(referencia_id) : null,
      },
    });

    res.status(201).json(alerta);
  } catch (err) {
    console.error("Error en POST /alertas:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo crear la alerta" });
  }
});

// PATCH /alertas/:alerta_id/leer  -> marcar alerta como leída
router.patch("/:alerta_id/leer", async (req, res) => {
  try {
    const id = Number(req.params.alerta_id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "alerta_id no válido" });
    }

    const alerta = await prisma.alerta.findUnique({ where: { id } });
    if (!alerta || alerta.usuarioId !== req.usuarioId) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "La alerta no existe" });
    }

    await prisma.alerta.update({ where: { id }, data: { leida: true } });

    res.json({ mensaje: "Alerta marcada como leída" });
  } catch (err) {
    console.error("Error en PATCH /alertas/:alerta_id/leer:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo actualizar la alerta" });
  }
});

module.exports = router;
