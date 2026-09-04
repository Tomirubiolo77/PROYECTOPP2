/**
 * Punto de Entrada del Servidor HTTP
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 * Semana 04: Autenticación JWT, RBAC, Lógica de Negocio y Prisma ORM
 */

require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  console.log('====================================================');
  console.log('🚀 Iniciando Servidor NutriScan Backend (Semana 04)');
  console.log('🔐 Seguridad: JWT + RBAC + Helmet + RateLimiting');
  console.log('🗄️  ORM: Prisma 5 + Neon PostgreSQL Cloud');
  console.log('====================================================');

  // Verificar conexión con Neon Cloud antes de escuchar peticiones
  const dbHealth = await db.testConnection();

  if (!dbHealth.connected) {
    console.warn('⚠️ ADVERTENCIA: La conexión a Neon PostgreSQL no se pudo establecer en el inicio.');
    console.warn('⚠️ Detalle:', dbHealth.error);
    console.warn('⚠️ El servidor continuará ejecutándose para recibir diagnósticos.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌐 Servidor Express escuchando en: http://localhost:${PORT}`);
    console.log(`🩺 Health check:               http://localhost:${PORT}/api/health`);
    console.log(`🔑 Login endpoint:             POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📦 Gestión de lotes:           http://localhost:${PORT}/api/lotes`);
    console.log(`🔬 Inspecciones en línea:      http://localhost:${PORT}/api/inspecciones`);
    console.log(`🏷️  Catálogo de defectos:       http://localhost:${PORT}/api/tipos-defecto`);
    console.log(`🚨 Alertas de calidad:         http://localhost:${PORT}/api/alertas`);
    console.log('====================================================');
  });

  // Manejo de apagado elegante (Graceful Shutdown)
  const shutdown = async (signal) => {
    console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor HTTP y conexiones de base de datos...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('🔒 Conexión de Prisma desconectada.');
        await db.pool.end();
        console.log('🔒 Pool de PostgreSQL cerrado correctamente.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error al cerrar conexiones de base de datos:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
