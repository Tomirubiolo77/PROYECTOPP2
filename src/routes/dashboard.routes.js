/**
 * Rutas de Analítica y Reportes del Dashboard
 * Proyecto: NutriScan - Calidad 4.0 (Semana 08)
 */

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Todas las rutas analíticas requieren autenticación (todos los roles autorizados)
router.use(authenticateToken);

// GET /api/dashboard/kpis - Total procesado, aprobados, rechazados, tasa de descarte y tiempo promedio
router.get('/kpis', dashboardController.getKpis);

// GET /api/dashboard/graficos - Pareto de defectos, evolución temporal y comparativa de envases
router.get('/graficos', dashboardController.getGraficos);

module.exports = router;
