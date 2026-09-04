/**
 * Módulo de Conexión a Base de Datos PostgreSQL (Neon Cloud)
 * Proyecto: NutriScan - Calidad 4.0
 */

// Pool nos permite tener multiples conexiones a la base de datos sin necesidad de estar creando nuevos clientes a cada rato.
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Con esta variable corroboramos que la url de la db sea correcta y este en el .env definida.
// En caso contrario nos dara este error fatal y no tendremos acceso a nada en nuestra API, lo cual es esencial para que el sistema funcione.
if (!connectionString) {
  console.error('❌ ERROR FATAL: La variable de entorno DATABASE_URL no está definida.');
}

// Configuración del Pool de conexiones optimizado para Neon Serverless
// Esto quiere decir que el pool estara optimizado para conexiones serverless, lo que significa que se adaptara a las conexiones que vengan de AWS Lambda.
// Y esto nos permite no estar creando nuevas conexiones a cada rato, lo que nos ahorra tiempo y recursos.
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones TLS/SSL en Neon
  },
  max: 10,                     // Máximo de clientes en el pool
  idleTimeoutMillis: 30000,    // Tiempo máximo de inactividad antes de cerrar cliente
  connectionTimeoutMillis: 10000 // Tiempo máximo para establecer conexión
});

// Eventos del Pool para trazabilidad y monitoreo
pool.on('connect', () => {
  // Conexión cliente adquirida
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente del Pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta SQL con parámetros seguros
 * @param {string} text - Consulta SQL parametrizada
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [SQL] Duración: ${duration}ms | Filas: ${res.rowCount} | Query: ${text.slice(0, 80).trim()}...`);
    }
    return res;
  } catch (error) {
    console.error(`❌ [SQL ERROR] Query: ${text} | Detalle: ${error.message}`);
    throw error;
  }
};

/**
 * Función para probar y verificar la conectividad efectiva con Neon Cloud
 * @returns {Promise<object>} Información del servidor PostgreSQL
 */
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW() AS server_time, current_database() AS db_name, version() AS db_version');
    const { server_time, db_name, db_version } = res.rows[0];
    console.log(`✅ [PostgreSQL Neon] Conectado exitosamente a la base: "${db_name}" | Hora Servidor: ${server_time}`);
    return {
      connected: true,
      serverTime: server_time,
      database: db_name,
      version: db_version
    };
  } catch (error) {
    console.error(`❌ [PostgreSQL Neon] Falló la prueba de conexión: ${error.message}`);
    return {
      connected: false,
      error: error.message
    };
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
