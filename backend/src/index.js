const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = require("./prismaClient");
const pacientesRouter = require("./routes/pacientes");
const medicamentosRouter = require("./routes/medicamentos");
const circulosRouter = require("./routes/circulos");
const alertasRouter = require("./routes/alertas");
const gamificacionRouter = require("./routes/gamificacion");
const chatbotRouter = require("./routes/chatbot");
const sintomasRouter = require("./routes/sintomas");

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "cuidame-dev-secret-cambiar";

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "CuidaME backend en funcionamiento",
    status: "ok",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// POST /auth/registro
app.post("/auth/registro", async (req, res) => {
  try {
    const { nombre, correo, contrasena, telefono } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "nombre, correo y contrasena son requeridos",
      });
    }

    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "Ya existe un usuario con ese correo",
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre, correo, contrasena: hash, telefono },
    });

    const token = jwt.sign({ id: nuevoUsuario.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
      },
    });
  } catch (err) {
    console.error("Error en /auth/registro:", err);
    res.status(500).json({
      error: "Error interno",
      detalle: "No se pudo registrar el usuario",
    });
  }
});

// POST /auth/login
app.post("/auth/login", async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalle: "correo y contrasena son requeridos",
      });
    }

    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const valido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valido) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });
  } catch (err) {
    console.error("Error en /auth/login:", err);
    res.status(500).json({
      error: "Error interno",
      detalle: "No se pudo iniciar sesión",
    });
  }
});

app.use("/pacientes", pacientesRouter);
app.use("/medicamentos", medicamentosRouter);
app.use("/circulos", circulosRouter);
app.use("/alertas", alertasRouter);
app.use("/gamificacion", gamificacionRouter);
app.use("/chatbot", chatbotRouter);
app.use("/sintomas", sintomasRouter);

app.listen(port, () => {
  console.log(`CuidaME backend escuchando en http://localhost:${port}`);
});
