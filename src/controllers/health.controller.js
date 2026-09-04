/**
 * Controlador de Salud y Diagnóstico del Sistema
 * Proyecto: NutriScan - Calidad 4.0
 */

const db = require('../config/db');

/**
 * Health check endpoint: verifica el estado del servidor Express y la conexión con PostgreSQL en Neon
 * GET /api/health
 */
const checkHealth = async (req, res, next) => {
  try {
    const dbStatus = await db.testConnection();

    const response = {
      success: true,
      status: dbStatus.connected ? 'HEALTHY' : 'DEGRADED',
      service: 'NutriScan Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        engine: 'PostgreSQL (Neon Cloud)',
        connected: dbStatus.connected,
        databaseName: dbStatus.database || null,
        serverTime: dbStatus.serverTime || null,
        ...(dbStatus.error && { error: dbStatus.error })
      }
    };

    const statusCode = dbStatus.connected ? 200 : 503;
    return res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkHealth
};
