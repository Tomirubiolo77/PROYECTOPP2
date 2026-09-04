/**
 * Punto de Entrada del Servidor HTTP
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 */

// Carga de variables de entorno
require('dotenv').config();
// Importación de la aplicación Express
const app = require('./app');
// Importación de la conexión a la base de datos
const db = require('./config/db');

// Definición del puerto
const PORT = process.env.PORT || 3000;

// Si el servidor arranca se mostrara el siguiente mensaje

const startServer = async () => {
  // Cuando se llama la funcion se mostrara el siguiente mensaje
  // Esto es para verificar que el servidor se está ejecutando
  // Pero esta a la espera de ver si arranco correctamente o no.
  console.log('====================================================');
  console.log('🚀 Iniciando Servidor NutriScan Backend (Semana 03)');
  console.log('====================================================');

  // Verificar conexión con Neon Cloud antes de escuchar peticiones
  // Esta variable espera el testConnection() que esta en db.js, que lo que hace es verificar que la base de datos esté funcionando
  // Si no funciona, no se podrá acceder a la API
  // Si funciona, se mostrará información sobre la API
  const dbHealth = await db.testConnection();

  // Si la conexión no es exitosa, se mostrará un mensaje de advertencia
  // Si paso por el catch dio connected: false y por eso muestra el mensaje de error de la db
  // Pero el servidor continuará ejecutándose para recibir diagnósticos
  if (!dbHealth.connected) {
    console.warn('⚠️ ADVERTENCIA: La conexión a Neon PostgreSQL no se pudo establecer en el inicio.');
    console.warn('⚠️ Detalle:', dbHealth.error);
    console.warn('⚠️ El servidor continuará ejecutándose para recibir diagnósticos.');
  }

  // Si la conexión es exitosa, se mostrará un mensaje de bienvenida
  // Pasa por el try y da connected:true
  // Esto es para verificar que el servidor está funcionando correctamente
  const server = app.listen(PORT, () => {
    console.log(`🌐 Servidor Express escuchando en: http://localhost:${PORT}`);
    console.log(`🩺 Health check disponible en:   http://localhost:${PORT}/api/health`);
    console.log(`📦 Catálogo de defectos en:     http://localhost:${PORT}/api/tipos-defecto`);
    console.log('====================================================');
  });

  // Manejo de apagado elegante (Graceful Shutdown)
  // Apagado controlado porque cuando se apaga el servidor se apaga la base de datos
  // y si no se cierra el pool de base de datos, se quedará abierto
  // y por eso no podrá recibir nuevas peticiones
  // Por eso es importante cerrar el pool de base de datos
  // guarda los datos pendientes en el disco, cierra las conexiones de forma ordenada y evita la corrupción de la información por un apagon inesperado
  const shutdown = async (signal) => {
    // Muestra el mensaje de apagado
    console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor y pool de base de datos...`);
    // Cierra el servidor HTTP de forma 
    server.close(async () => {
      try {
        // Espera a que se cierre el pool de base de datos de forma ordenada
        // y evita la corrupción de la información por un apagon inesperado
        await db.pool.end();
        // Muestra el mensaje de cierre del pool de base de datos
        console.log('🔒 Pool de PostgreSQL cerrado correctamente.');
        // Sale del proceso
        process.exit(0);
      } catch (err) {
        // En caso de error, se muestra el mensaje de error
        console.error('❌ Error al cerrar el pool de PostgreSQL:', err.message);
        process.exit(1);
      }
    });
  };

  // Manejo de señales de apagado
  // SIGINT es cuando se presiona Ctrl + C (Desarrollo local)
  process.on('SIGINT', () => shutdown('SIGINT'));

  // SIGTERM es cuando la plataforma de hosting (Render, AWS, Docker) solicita apagar el servidor por no estar en uso.
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
