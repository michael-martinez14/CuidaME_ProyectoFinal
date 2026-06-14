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
