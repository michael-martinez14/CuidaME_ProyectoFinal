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
