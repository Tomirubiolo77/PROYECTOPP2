/**
 * Rutas de Gestión de Alertas Operativas
 * Proyecto: NutriScan - Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const alertasController = require('../controllers/alertas.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Todas las rutas de alertas requieren autenticación
router.use(authenticateToken);

// GET /api/alertas/metricas - Resumen de alertas para el dashboard (SUPERVISOR, ADMIN)
router.get('/metricas', authorizeRoles('SUPERVISOR', 'ADMIN'), alertasController.metricas);

// GET /api/alertas - Listar alertas (SUPERVISOR, ADMIN)
router.get('/', authorizeRoles('SUPERVISOR', 'ADMIN'), alertasController.listarAlertas);

// GET /api/alertas/:id - Detalle de alerta individual
router.get('/:id', authorizeRoles('SUPERVISOR', 'ADMIN'), alertasController.obtenerPorId);

// PATCH /api/alertas/:id/atender - Atender alerta (SUPERVISOR, ADMIN)
router.patch('/:id/atender', authorizeRoles('SUPERVISOR', 'ADMIN'), alertasController.atenderAlerta);

// PUT /api/alertas/:id - Editar alerta (Solo ADMIN)
router.put('/:id', authorizeRoles('ADMIN'), alertasController.actualizarAlerta);

module.exports = router;
