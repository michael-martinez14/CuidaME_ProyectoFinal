const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/mensaje", async (req, res) => {
  try {
    const { consulta } = req.body;

    if (!consulta || !consulta.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "consulta es requerida" });
    }

    await prisma.mensajeChat.create({
      data: { usuarioId: req.usuarioId, autor: "usuario", contenido: consulta },
    });

    const respuesta =
      "Soy el asistente de CuidaME. Por ahora no estoy conectado a un modelo de IA, " +
      "pero pronto podré ayudarte con medicamentos, síntomas y recordatorios. " +
      "Tu consulta fue: \"" + consulta + "\".";

    await prisma.mensajeChat.create({
      data: { usuarioId: req.usuarioId, autor: "asistente", contenido: respuesta },
    });

    res.json({ respuesta });
  } catch (err) {
    console.error("Error en POST /chatbot/mensaje:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo procesar la consulta" });
  }
});

module.exports = router;
