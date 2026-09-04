const express = require('express');
const router = express.Router();
const tiposDefectoController = require('../controllers/tiposDefecto.controller');

// GET /api/tipos-defecto (opcional: ?tipo_envase=FRASCO|LATA)
router.get('/', tiposDefectoController.listarTiposDefecto);

// GET /api/tipos-defecto/:id
router.get('/:id', tiposDefectoController.obtenerTipoDefectoPorId);

module.exports = router;
