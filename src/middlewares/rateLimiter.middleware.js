/**
 * Middleware de Mitigación de Ataques de Fuerza Bruta y DoS (Rate Limiting)
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: Protección contra ataques de fuerza bruta en login y saturación de API.
 */

const rateLimit = require('express-rate-limit');

/**
 * Limitador estricto para el endpoint de login
 * Permite 5 intentos fallidos/exitosos por IP cada 15 minutos en producción.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // Más permisivo en tests para suites automatizadas
  standardHeaders: true, // Devuelve headers RateLimit-* estándar
  legacyHeaders: false, // Deshabilita headers X-RateLimit-*
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor intente nuevamente en 15 minutos.'
  },
  skipSuccessfulRequests: false
});

/**
 * Limitador general de la API para prevención de denegación de servicio (DoS)
 * Permite 100 solicitudes por minuto por IP.
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'test' ? 5000 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Tasa de solicitudes excedida. Reduzca la frecuencia de peticiones a la API.'
  }
});

module.exports = {
  loginLimiter,
  apiLimiter
};
