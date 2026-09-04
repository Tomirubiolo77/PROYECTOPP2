/**
 * Configuración de la aplicación Express
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 * Seguridad: Helmet, CORS, Rate Limiting, Sanitización y Manejo Centralizado de Errores.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes/index.routes');
const errorHandler = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// ==========================================
// 1. Middlewares de Seguridad y Red
// ==========================================

// Helmet: Configuración de cabeceras HTTP seguras (XSS, Clickjacking, MIME sniffing, HSTS)
app.use(helmet());

// CORS: Configuración permisiva pero controlada para el frontend
app.use(cors({
  origin: '*', // Se ajustará a la URL del frontend en la Semana 5
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter general para mitigar ataques de denegación de servicio (DoS)
app.use('/api', apiLimiter);

// Parseo de cuerpo con límite de tamaño para evitar ataques de desbordamiento de memoria (Payload Exhaustion)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Logging de peticiones HTTP en desarrollo
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ==========================================
// 2. Endpoint Raíz Informativo
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    proyecto: 'NutriScan — Sistema de Inspección y Registro de Calidad 4.0',
    kit: 'AVZ-02 — Visión para Control de Calidad',
    version: '1.4.0 (Semana 04 - Auth, RBAC & Business Logic)',
    seguridad: 'JWT + RBAC + Helmet + RateLimiter + Prisma ORM',
    endpoints_principales: {
      health: '/api/health',
      auth_login: 'POST /api/auth/login',
      auth_perfil: 'GET /api/auth/perfil',
      lotes: '/api/lotes',
      lote_activo: '/api/lotes/activo',
      inspecciones: '/api/inspecciones',
      inspecciones_por_lote: '/api/inspecciones/lote/:loteId',
      tipos_defecto: '/api/tipos-defecto',
      alertas: '/api/alertas',
      alertas_metricas: '/api/alertas/metricas'
    },
    status: 'ONLINE'
  });
});

// ==========================================
// 3. Montaje del Enrutador Principal
// ==========================================
app.use('/api', apiRoutes);

// ==========================================
// 4. Manejador de Rutas No Encontradas (404)
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// 5. Middleware Global de Manejo de Errores
// ==========================================
app.use(errorHandler);

module.exports = app;
