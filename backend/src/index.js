const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

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

app.listen(port, () => {
	console.log(`CuidaME backend escuchando en http://localhost:${port}`);
});

// POST /auth/registro
app.post("/auth/registro", (req, res) => {
  const { nombre, correo, contrasena, telefono } = req.body;
 
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: "Datos inválidos", detalle: "nombre, correo y contrasena son requeridos" });
  }
 
  const existe = usuarios.find((u) => u.correo === correo);
  if (existe) {
    return res.status(400).json({ error: "Datos inválidos", detalle: "Ya existe un usuario con ese correo" });
  }
 
  const nuevoUsuario = { id: usuarios.length + 1, nombre, correo, contrasena, telefono };
  usuarios.push(nuevoUsuario);
 
  res.status(201).json({
    token: `mock-token-${nuevoUsuario.id}`,
    usuario: { id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, correo: nuevoUsuario.correo },
  });
});
 
// POST /auth/login
app.post("/auth/login", (req, res) => {
  const { correo, contrasena } = req.body;
 
  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Datos inválidos", detalle: "correo y contrasena son requeridos" });
  }
 
  const usuario = usuarios.find((u) => u.correo === correo && u.contrasena === contrasena);
  if (!usuario) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
 
  res.status(200).json({
    token: `mock-token-${usuario.id}`,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
  });
});
