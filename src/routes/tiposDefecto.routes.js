/**
 * Rutas para el Catálogo de Tipos de Defecto
 * Proyecto: NutriScan - Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const tiposDefectoController = require('../controllers/tiposDefecto.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validateTipoDefecto } = require('../middlewares/validator.middleware');

// GET /api/tipos-defecto - Lectura pública / general del catálogo de fallas
router.get('/', tiposDefectoController.listar);

// GET /api/tipos-defecto/:id - Consulta por ID
router.get('/:id', tiposDefectoController.obtenerPorId);

// Rutas de administración (Solo ADMIN)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateTipoDefecto,
  tiposDefectoController.crear
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  tiposDefectoController.actualizar
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  tiposDefectoController.eliminar
);

module.exports = router;
