/**
 * Cliente Singleton de Prisma ORM
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 */

// Esto corre solo si el mode es development, nos muestra errores y advertencias, cosa que no queremos en produccion para no saturar el logs.
// Esto se hace para no saturar el logs con errores y advertencias que no son relevantes para el usuario final.
// Al igual que en el db.js, usamos env() para que no tengamos que estar cambiando la url de la db cada rato, si no que la tomemos del .env.
const { PrismaClient } = require('@prisma/client');

// Como usamos Prisma, creamos una instancia de PrismaClient.
// Esto nos permite tener multiples conexiones a la base de datos sin necesidad de estar creando nuevos clientes a cada rato.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prisma;
