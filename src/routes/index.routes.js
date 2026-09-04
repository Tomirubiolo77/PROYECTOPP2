const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const tiposDefectoRoutes = require('./tiposDefecto.routes');

// Definición de subrutas API
router.use('/health', healthRoutes);
router.use('/tipos-defecto', tiposDefectoRoutes);

module.exports = router;
