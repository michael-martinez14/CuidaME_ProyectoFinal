const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../authMiddleware");

const router = express.Router();

// Todas las rutas de pacientes requieren estar autenticado.
router.use(authMiddleware);

const SEXOS = ["masculino", "femenino", "otro"];

router.post("/", async (req, res) => {
  try {
    const { nombre, fecha_nacimiento, sexo, telefono, direccion } = req.body;

    if (!nombre || !fecha_nacimiento || !sexo) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "nombre, fecha_nacimiento y sexo son requeridos",
      });
    }
    if (!SEXOS.includes(sexo)) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "sexo debe ser masculino, femenino u otro",
      });
    }

    const paciente = await prisma.paciente.create({
      data: {
        nombre,
        fechaNacimiento: new Date(fecha_nacimiento),
        sexo,
        telefono,
        direccion,
        creadoPorId: req.usuarioId,
      },
    });

    const circulo = await prisma.circulo.create({
      data: {
        nombre: `Círculo de ${paciente.nombre}`,
        pacienteId: paciente.id,
      },
    });

    await prisma.miembroCirculo.create({
      data: {
        usuarioId: req.usuarioId,
        circuloId: circulo.id,
        rol: "cuidador_principal",
        estado: "activo",
      },
    });

    res.status(201).json({ ...paciente, enfermedades: [], circulo });
  } catch (err) {
    console.error("Error en POST /pacientes:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo crear el paciente" });
  }
});

// GET /pacientes  -> listar los pacientes creados por el usuario actual
router.get("/", async (req, res) => {
  try {
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { creadoPorId: req.usuarioId },
          {
            circulo: {
              miembros: { some: { usuarioId: req.usuarioId, estado: "activo" } },
            },
          },
        ],
      },
      include: { enfermedades: true, circulo: true },
      orderBy: { creadoEn: "desc" },
    });
    res.json(pacientes);
  } catch (err) {
    console.error("Error en GET /pacientes:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudieron listar los pacientes" });
  }
});

// GET /pacientes/:id  - obtener perfil del paciente
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: { enfermedades: true, circulo: true },
    });

    if (!paciente) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El paciente no existe" });
    }

    res.json(paciente);
  } catch (err) {
    console.error("Error en GET /pacientes/:id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo obtener el paciente" });
  }
});

// PUT /pacientes/:id  - actualizar datos del paciente
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const { nombre, fecha_nacimiento, sexo, telefono, direccion } = req.body;

    if (sexo && !SEXOS.includes(sexo)) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "sexo debe ser masculino, femenino u otro",
      });
    }

    const existe = await prisma.paciente.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El paciente no existe" });
    }

    const paciente = await prisma.paciente.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(fecha_nacimiento !== undefined && { fechaNacimiento: new Date(fecha_nacimiento) }),
        ...(sexo !== undefined && { sexo }),
        ...(telefono !== undefined && { telefono }),
        ...(direccion !== undefined && { direccion }),
      },
      include: { enfermedades: true, circulo: true },
    });

    res.json(paciente);
  } catch (err) {
    console.error("Error en PUT /pacientes/:id:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo actualizar el paciente" });
  }
});

// POST /pacientes/:id/enfermedades  - agregar enfermedad al paciente
router.post("/:id/enfermedades", async (req, res) => {
  try {
    const pacienteId = Number(req.params.id);
    if (Number.isNaN(pacienteId)) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "id no válido" });
    }

    const { nombre, fecha_diagnostico, medico_tratante, notas } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "Datos inválidos", detalle: "nombre es requerido" });
    }

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente) {
      return res.status(404).json({ error: "Recurso no encontrado", detalle: "El paciente no existe" });
    }

    const enfermedad = await prisma.enfermedad.create({
      data: {
        pacienteId,
        nombre,
        fechaDiagnostico: fecha_diagnostico ? new Date(fecha_diagnostico) : null,
        medicoTratante: medico_tratante,
        notas,
      },
    });

    res.status(201).json(enfermedad);
  } catch (err) {
    console.error("Error en POST /pacientes/:id/enfermedades:", err);
    res.status(500).json({ error: "Error interno", detalle: "No se pudo agregar la enfermedad" });
  }
});

module.exports = router;
