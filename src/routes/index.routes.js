/**
 * Enrutador Maestro de la API
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const tiposDefectoRoutes = require('./tiposDefecto.routes');
const lotesRoutes = require('./lotes.routes');
const inspeccionesRoutes = require('./inspecciones.routes');
const alertasRoutes = require('./alertas.routes');

// Subrutas API RESTful
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tipos-defecto', tiposDefectoRoutes);
router.use('/lotes', lotesRoutes);
router.use('/inspecciones', inspeccionesRoutes);
router.use('/alertas', alertasRoutes);

module.exports = router;
