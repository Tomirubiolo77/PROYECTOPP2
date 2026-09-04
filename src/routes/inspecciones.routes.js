/**
 * Rutas de Inspecciones de Calidad
 * Proyecto: NutriScan - Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const inspeccionesController = require('../controllers/inspecciones.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validateCrearInspeccion } = require('../middlewares/validator.middleware');

// Todas las rutas de inspecciones requieren sesión activa
router.use(authenticateToken);

// POST /api/inspecciones - Registrar evento de inspección (OPERARIO, SUPERVISOR, ADMIN)
router.post('/', validateCrearInspeccion, inspeccionesController.registrarInspeccion);

// GET /api/inspecciones/lote/:loteId - Consultar historial e indicadores por lote (OPERARIO, SUPERVISOR, ADMIN)
router.get('/lote/:loteId', inspeccionesController.historialPorLote);

// GET /api/inspecciones - Listado global para auditoría e informes (SUPERVISOR, ADMIN)
router.get('/', authorizeRoles('SUPERVISOR', 'ADMIN'), inspeccionesController.listarInspecciones);

// GET /api/inspecciones/:id - Detalle de inspección individual
router.get('/:id', inspeccionesController.obtenerPorId);

module.exports = router;
