/**
 * Rutas del Módulo de Autenticación
 * Proyecto: NutriScan - Calidad 4.0
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { validateLogin } = require('../middlewares/validator.middleware');

// POST /api/auth/login - Inicio de sesión con rate limiting y validación de esquema
// Entonces /login es la ruta que se encarga de autenticar a los usuarios. 
// Si el usuario no esta autenticado, no puede acceder a ciertas rutas.
router.post('/login', loginLimiter, validateLogin, authController.login);

// GET /api/auth/perfil - Consulta de datos del usuario en sesión activa
// Entonces /perfil es la ruta que se encarga de obtener los datos del usuario en sesión activa.
// Si el usuario no esta autenticado, no puede acceder a la ruta.
router.get('/perfil', authenticateToken, authController.perfil);

// Si el usuario existe le mostrara la pantalla inicial o la pantalla que le corresponde segun su rol que seria dirigirse a los dashboard de cada rol y esto se hace desde el frontend.

module.exports = router;
