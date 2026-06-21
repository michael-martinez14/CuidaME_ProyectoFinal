const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");
const { otorgarPuntos } = require("../puntos");

const router = express.Router();
const INTENSIDADES = ["leve", "moderada", "severa"];

router.use(authMiddleware);

// POST /sintomas  - registrar un síntoma del paciente. Suma puntos a quien lo
// registra (acción de cuidado "registrar_sintoma").
router.post("/", async (req, res) => {
  try {
    const { paciente_id, descripcion, intensidad } = req.body;

    if (!paciente_id || !descripcion || !descripcion.trim()) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "paciente_id y descripcion son requeridos",
      });
    }
    if (intensidad && !INTENSIDADES.includes(intensidad)) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "intensidad debe ser leve, moderada o severa",
      });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(paciente_id) },
      include: { circulo: true },
    });
    if (!paciente) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El paciente no existe" });
    }

    const sintoma = await prisma.sintoma.create({
      data: {
        pacienteId: Number(paciente_id),
        descripcion: descripcion.trim(),
        intensidad: intensidad || null,
        registradoPorId: req.usuarioId,
      },
    });

    // Suma puntos a quien registró el síntoma.
    const puntos = await otorgarPuntos({
      usuarioId: req.usuarioId,
      tipo: "registrar_sintoma",
      circuloId: paciente.circulo ? paciente.circulo.id : null,
    });

    res.status(201).json({ ...sintoma, puntos_sumados: puntos });
  } catch (err) {
    console.error("Error en POST /sintomas:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo registrar el síntoma" });
  }
});

// GET /sintomas/paciente/:pacienteId  - listar síntomas del paciente
router.get("/paciente/:pacienteId", async (req, res) => {
  try {
    const pacienteId = Number(req.params.pacienteId);
    if (Number.isNaN(pacienteId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "paciente_id no válido" });
    }

    const sintomas = await prisma.sintoma.findMany({
      where: { pacienteId },
      orderBy: { fechaHora: "desc" },
      include: { registradoPor: { select: { id: true, nombre: true } } },
    });

    res.json(sintomas);
  } catch (err) {
    console.error("Error en GET /sintomas/paciente/:pacienteId:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar los síntomas" });
  }
});

// DELETE /sintomas/:id  - eliminar un síntoma
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const existe = await prisma.sintoma.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El síntoma no existe" });
    }

    await prisma.sintoma.delete({ where: { id } });

    res.json({ mensaje: "Síntoma eliminado correctamente" });
  } catch (err) {
    console.error("Error en DELETE /sintomas/:id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo eliminar el síntoma" });
  }
});

module.exports = router;
