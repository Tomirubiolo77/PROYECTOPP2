/**
 * Configuración de la aplicación Express
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 */

// Importación de módulos de las dependencias
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Importación de módulos locales
const apiRoutes = require('./routes/index.routes');

// Inicialización de la aplicación Express
const app = express();

// Middlewares Globales
// Se les da permiso a los usuarios de entrar a la API
// CORS: Permite solicitudes desde cualquier origen
app.use(cors());
// JSON: Permite parsear solicitudes con cuerpo en formato JSON
app.use(express.json());
// URL-encoded: Permite parsear solicitudes con cuerpo en formato URL-encoded
app.use(express.urlencoded({ extended: true }));

// Morgan: Muestra información sobre las solicitudes
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Endpoint Raíz Informativo
// Esto es para probar que la API está funcionando
// Si no funciona, no se podrá acceder a la API que fue creada para tests
// Si funciona, se mostrará información sobre la API
app.get('/', (req, res) => {
  res.status(200).json({
    proyecto: 'NutriScan — Sistema de Inspección y Registro de Calidad 4.0',
    kit: 'AVZ-02 — Visión para Control de Calidad',
    version: '1.0.0',
    endpoints_principales: {
      health: '/api/health',
      tipos_defecto: '/api/tipos-defecto',
      tipos_defecto_frasco: '/api/tipos-defecto?tipo_envase=FRASCO',
      tipos_defecto_lata: '/api/tipos-defecto?tipo_envase=LATA'
    },
    status: 'ONLINE'
  });
});

// Enrutador de la API
app.use('/api', apiRoutes);

// Manejador de rutas no encontradas (404)
// Si no se encuentra la ruta, se mostrará un mensaje de error
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware Global de Manejo de Errores (500)
// En caso de que express falle, se mostrará un mensaje de error
// Esto es para manejar errores en tiempo de ejecución
app.use((err, req, res, next) => {
  console.error('💥 [EXPRESS ERROR]:', err.stack || err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
