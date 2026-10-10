/**
 * Rutas de Gestión de Lotes de Producción
 * Proyecto: NutriScan - Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const lotesController = require('../controllers/lotes.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validateCrearLote } = require('../middlewares/validator.middleware');

// Todas las rutas de lotes requieren estar autenticado
router.use(authenticateToken);

// GET /api/lotes/activo - Lote actualmente activo para la línea de producción
router.get('/activo', lotesController.obtenerLoteActivo);

// GET /api/lotes - Listado de lotes (con filtros por estado y tipo_envase)
router.get('/', lotesController.listarLotes);

// GET /api/lotes/:id - Detalle de un lote
router.get('/:id', lotesController.obtenerPorId);

// POST /api/lotes - Apertura de lote (Solo SUPERVISOR y ADMIN)
router.post('/', authorizeRoles('SUPERVISOR', 'ADMIN'), validateCrearLote, lotesController.crearLote);

// PATCH /api/lotes/:id/cerrar - Cierre de lote por operario (pasa a PENDIENTE_CIERRE)
router.patch('/:id/cerrar', authorizeRoles('OPERARIO', 'SUPERVISOR', 'ADMIN'), lotesController.cerrarLote);

// PATCH /api/lotes/:id/detener - Parada de emergencia / detener línea (OPERARIO, SUPERVISOR, ADMIN)
router.patch('/:id/detener', authorizeRoles('OPERARIO', 'SUPERVISOR', 'ADMIN'), lotesController.detenerLote);

// PATCH /api/lotes/:id/reanudar - Reanudar línea detenida (Solo SUPERVISOR y ADMIN)
router.patch('/:id/reanudar', authorizeRoles('SUPERVISOR', 'ADMIN'), lotesController.reanudarLote);

// PATCH /api/lotes/:id/finalizar - Cierre de lote / Visto bueno final (Solo SUPERVISOR y ADMIN)
router.patch('/:id/finalizar', authorizeRoles('SUPERVISOR', 'ADMIN'), lotesController.finalizarLote);

module.exports = router;
