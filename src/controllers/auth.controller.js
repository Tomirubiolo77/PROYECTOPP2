/**
 * Controlador de Autenticación
 * Proyecto: NutriScan - Calidad 4.0
 */

const authService = require('../services/auth.service');

/**
 * Endpoint de Login (POST /api/auth/login)
 */
const login = async (req, res, next) => {

  // Entonces login es el endpoint que se encarga de autenticar a los usuarios.
  // Esto es para que el usuario pueda iniciar sesion en el sistema.
  // Si el usuario no esta autenticado, no puede acceder a ciertas rutas.

  try {
    // El usuario envia dos datos: correo y contraseña. Pero no de cualquier manera, si no que en formato json.
    // Ejemplo: { "email": "[EMAIL_ADDRESS]", "password": "123" }
    // Al pasar los datos, se llama a login de authSevice donde se encarga de verificar que el usuario este autenticado y tenga permisos para acceder a ciertos recursos.
    // Esto dara exito, si falla en el login ira al catch y mostrara el error.
    const { email, password } = req.body;
    // El resultado es el token que se genera cuando el usuario inicia sesion.
    const result = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint de Perfil (GET /api/auth/perfil)
 */
const perfil = async (req, res, next) => {
  try {
    // Llama a obtenerPerfil que se encarga de verificar que el usuario exista y devuelva sus datos.
    const usuario = await authService.obtenerPerfil(req.user.id);

    return res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  perfil
};
