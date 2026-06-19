const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// POST /medicamentos  - registrar un nuevo medicamento
router.post("/", async (req, res) => {
  try {
    const {
      paciente_id,
      nombre,
      dosis,
      frecuencia_horas,
      hora_inicio,
      fecha_inicio,
      fecha_fin,
      instrucciones,
    } = req.body;

    if (!paciente_id || !nombre || !dosis || !frecuencia_horas || !hora_inicio) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "paciente_id, nombre, dosis, frecuencia_horas y hora_inicio son requeridos",
      });
    }

    const paciente = await prisma.paciente.findUnique({ where: { id: Number(paciente_id) } });
    if (!paciente) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El paciente no existe" });
    }

    const medicamento = await prisma.medicamento.create({
      data: {
        pacienteId: Number(paciente_id),
        nombre,
        dosis,
        frecuenciaHoras: Number(frecuencia_horas),
        horaInicio: hora_inicio,
        fechaInicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fechaFin: fecha_fin ? new Date(fecha_fin) : null,
        instrucciones,
      },
    });

    res.status(201).json(medicamento);
  } catch (err) {
    console.error("Error en POST /medicamentos:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo registrar el medicamento" });
  }
});

// GET /medicamentos/paciente/:pacienteId?activos=true  - listar medicamentos del paciente
router.get("/paciente/:pacienteId", async (req, res) => {
  try {
    const pacienteId = Number(req.params.pacienteId);
    if (Number.isNaN(pacienteId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "paciente_id no válido" });
    }

    const where = { pacienteId };
    if (req.query.activos !== undefined) {
      where.activo = req.query.activos === "true";
    }

    const medicamentos = await prisma.medicamento.findMany({
      where,
      orderBy: { creadoEn: "desc" },
    });

    res.json(medicamentos);
  } catch (err) {
    console.error("Error en GET /medicamentos/paciente/:pacienteId:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar los medicamentos" });
  }
});

// PUT /medicamentos/:id  - editar medicamento
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const existe = await prisma.medicamento.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El medicamento no existe" });
    }

    const {
      nombre,
      dosis,
      frecuencia_horas,
      hora_inicio,
      fecha_inicio,
      fecha_fin,
      instrucciones,
      activo,
    } = req.body;

    const medicamento = await prisma.medicamento.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(dosis !== undefined && { dosis }),
        ...(frecuencia_horas !== undefined && { frecuenciaHoras: Number(frecuencia_horas) }),
        ...(hora_inicio !== undefined && { horaInicio: hora_inicio }),
        ...(fecha_inicio !== undefined && { fechaInicio: fecha_inicio ? new Date(fecha_inicio) : null }),
        ...(fecha_fin !== undefined && { fechaFin: fecha_fin ? new Date(fecha_fin) : null }),
        ...(instrucciones !== undefined && { instrucciones }),
        ...(activo !== undefined && { activo: Boolean(activo) }),
      },
    });

    res.json(medicamento);
  } catch (err) {
    console.error("Error en PUT /medicamentos/:id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo actualizar el medicamento" });
  }
});

// DELETE /medicamentos/:id  - eliminar medicamento
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const existe = await prisma.medicamento.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El medicamento no existe" });
    }

    await prisma.medicamento.delete({ where: { id } });

    res.json({ mensaje: "Medicamento eliminado correctamente" });
  } catch (err) {
    console.error("Error en DELETE /medicamentos/:id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo eliminar el medicamento" });
  }
});

module.exports = router;
