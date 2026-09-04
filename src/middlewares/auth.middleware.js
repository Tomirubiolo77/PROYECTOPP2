/**
 * Middleware de Autenticación JWT y Control de Sesión
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: Validación criptográfica de tokens y verificación de usuario activo.
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Middleware para proteger rutas que requieran autenticación
 */

// Entonces authenticateToken es como el guardian de las rutas, si el usuario no pasa el token, no puede acceder a la ruta.
// Esto es para proteger las rutas que requieren autenticación.
// Porque si no esta esto los usuarios podrian entrar a cualquier ruta sin ningun problema, lo que seria un problema de seguridad.
// En caso de que el usuario no pase el token, se le devuelve un error 401 y no puede acceder a la ruta.
// En caso de que el usuario pase el token, se verifica que sea valido y se le permite el acceso a la ruta.

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    // Esta parte solo verifica que el header contenga un token Bearer. Un token bearer es un token que se usa para autenticar a los usuarios.
    // Es como si el usuario tuviera un carnet de identidad que dice "soy quien digo ser".
    // El token bearer es un token que se genera cuando el usuario inicia sesion.
    // Si el usuario no tiene un token bearer, no puede acceder a la ruta.
    // Si el usuario tiene un token bearer, se verifica que sea valido y se le permite el acceso a la ruta.

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: No se proporcionó un token Bearer válido'
      });
    }
    // En caso de que el usuario no pase el token, se le devuelve un error 401 y no puede acceder a la ruta.

    const token = authHeader.split(' ')[1];
    // En caso de que el usuario pase el token, se verifica que sea valido y se le permite el acceso a la ruta.
    // Si el token es invalido, se le devuelve un error 401 y no puede acceder a la ruta.

    // Esta parte solo verifica que el token sea valido.
    // En caso de que el token sea invalido, se le devuelve un error 401 y no puede acceder a la ruta.
    // Un token es invalido si no existe o si es diferente al que se genero cuando el usuario inicio sesion.
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: Token no proporcionado'
      });
    }

    // Verificación criptográfica del JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_fallback_key');

    // Comprobar que el usuario siga existiendo y esté activo en la base de datos
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: El usuario asociado al token no existe'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: El usuario ha sido desactivado del sistema'
      });
    }

    // Inyección de la sesión autenticada en req.user (sin hash de contraseña)
    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sesión expirada: El token JWT ha caducado. Inicie sesión nuevamente'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o firma criptográfica alterada'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno al validar la sesión'
    });
  }
};

module.exports = {
  authenticateToken
};
