// Cliente único de Prisma reutilizado en toda la app.
// Evita abrir muchas conexiones a MySQL creando una sola instancia.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
