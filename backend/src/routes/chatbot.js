const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// --- Configuración de OpenRouter -------------------------------------------
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Cuántos mensajes previos del historial se le mandan al modelo como contexto.
const MAX_HISTORIAL = 10;

const SYSTEM_PROMPT = `Eres el asistente virtual de CuidaME, una plataforma de apoyo para cuidadores
de personas mayores o con enfermedades crónicas en Honduras. Tu rol es ayudar con dudas generales
sobre medicamentos, síntomas y cuidado de pacientes, usando la información de contexto que se te
proporcione cuando esté disponible.

Reglas importantes:
- NO eres un médico y NO debes dar diagnósticos ni indicar dosis o cambios de tratamiento.
- Si la consulta suena a una emergencia médica (dolor de pecho intenso, dificultad para respirar,
  pérdida de consciencia, sangrado severo, etc.), indica con claridad que debe buscar atención
  médica de inmediato o llamar a emergencias.
- Para temas médicos específicos, siempre recomienda confirmar con el médico tratante del paciente.
- Responde en español, de forma breve, clara y cálida, como corresponde a un cuidador que puede estar
  cansado o preocupado.
- Si tienes información del paciente (medicamentos activos, síntomas recientes), úsala para dar
  respuestas más concretas y relevantes, pero nunca inventes datos que no se te dieron.`;

// Construye un bloque de contexto en texto plano con datos del paciente
// asociado al usuario (si tiene alguno), para dar respuestas más útiles.
async function construirContextoPaciente(usuarioId) {
  const paciente = await prisma.paciente.findFirst({
    where: {
      OR: [
        { creadoPorId: usuarioId },
        { circulo: { miembros: { some: { usuarioId, estado: "activo" } } } },
      ],
    },
    include: {
      enfermedades: true,
      medicamentos: { where: { activo: true } },
      sintomas: { orderBy: { fechaHora: "desc" }, take: 5 },
    },
  });

  if (!paciente) return null;

  const partes = [`Paciente: ${paciente.nombre} (sexo: ${paciente.sexo}).`];

  if (paciente.enfermedades.length) {
    partes.push(
      "Enfermedades diagnosticadas: " +
        paciente.enfermedades.map((e) => e.nombre).join(", ") +
        "."
    );
  }

  if (paciente.medicamentos.length) {
    partes.push(
      "Medicamentos activos: " +
        paciente.medicamentos
          .map((m) => `${m.nombre} (${m.dosis}, cada ${m.frecuenciaHoras}h)`)
          .join("; ") +
        "."
    );
  }

  if (paciente.sintomas.length) {
    partes.push(
      "Síntomas reportados recientemente: " +
        paciente.sintomas
          .map((s) => `${s.descripcion}${s.intensidad ? ` (${s.intensidad})` : ""}`)
          .join("; ") +
        "."
    );
  }

  return partes.join("\n");
}

router.post("/mensaje", async (req, res) => {
  try {
    const { consulta } = req.body;

    if (!consulta || !consulta.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "consulta es requerida" });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Error interno",
        detalle: "El chatbot no está configurado (falta OPENROUTER_API_KEY en el servidor)",
      });
    }

    await prisma.mensajeChat.create({
      data: { usuarioId: req.usuarioId, autor: "usuario", contenido: consulta },
    });

    // Historial reciente para mantener contexto conversacional.
    const historial = await prisma.mensajeChat.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { creadoEn: "desc" },
      take: MAX_HISTORIAL,
    });
    historial.reverse(); // orden cronológico

    const contextoPaciente = await construirContextoPaciente(req.usuarioId);

    const mensajesIA = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(contextoPaciente
        ? [{ role: "system", content: `Información del paciente a cargo:\n${contextoPaciente}` }]
        : []),
      ...historial.map((m) => ({
        role: m.autor === "usuario" ? "user" : "assistant",
        content: m.contenido,
      })),
    ];

    let respuesta;
    try {
      const apiRes = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          // Recomendados por OpenRouter para identificar la app (opcionales pero útiles).
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3001",
          "X-Title": "CuidaME",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: mensajesIA,
          temperature: 0.4,
          max_tokens: 500,
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok) {
        console.error("Error de OpenRouter:", data);
        throw new Error(data?.error?.message || "Error al consultar el modelo de IA");
      }

      respuesta = data?.choices?.[0]?.message?.content?.trim();
      if (!respuesta) {
        throw new Error("El modelo no devolvió una respuesta válida");
      }
    } catch (iaErr) {
      console.error("Error al consultar OpenRouter:", iaErr);
      respuesta =
        "Lo siento, no pude conectarme con el asistente de IA en este momento. " +
        "Por favor intenta de nuevo en unos segundos.";
    }

    await prisma.mensajeChat.create({
      data: { usuarioId: req.usuarioId, autor: "asistente", contenido: respuesta },
    });

    res.json({ respuesta });
  } catch (err) {
    console.error("Error en POST /chatbot/mensaje:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo procesar la consulta" });
  }
});

// GET /chatbot/historial - devuelve el historial de mensajes del usuario.
router.get("/historial", async (req, res) => {
  try {
    const mensajes = await prisma.mensajeChat.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { creadoEn: "asc" },
    });
    res.json(mensajes);
  } catch (err) {
    console.error("Error en GET /chatbot/historial:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo obtener el historial" });
  }
});

module.exports = router;

