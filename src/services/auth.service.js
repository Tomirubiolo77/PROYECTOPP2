/**
 * Servicio de Autenticación y Control de Sesión
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: Verificación con bcrypt y emisión de tokens JWT firmados.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Autentica un usuario verificando credenciales y emite un JWT
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Objeto con token y datos seguros del usuario
 */
const login = async (email, password) => {
  // Búsqueda del usuario por correo electrónico
  const usuario = await prisma.usuarios.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  // Seguridad OWASP: Mensaje genérico para evitar enumeración de usuarios
  if (!usuario) {
    const error = new Error('Credenciales inválidas: correo o contraseña incorrectos');
    error.statusCode = 401;
    throw error;
  }

  // Comprobar estado activo del usuario
  if (!usuario.activo) {
    const error = new Error('Cuenta de usuario inactiva. Contacte al administrador del sistema');
    error.statusCode = 403;
    throw error;
  }

  // Verificación del hash de la contraseña con bcrypt
  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    const error = new Error('Credenciales inválidas: correo o contraseña incorrectos');
    error.statusCode = 401;
    throw error;
  }

  // Generación de JWT con payload mínimo (principio de menor privilegio)
  // Esto te permite tener un token con la informacion basica del usuario, para que el front pueda identificarlo y saber que rol tiene para poder mostrarle la informacion que corresponde.
  // 
  const tokenPayload = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol
  };

  const jwtSecret = process.env.JWT_SECRET || 'fallback_nutriscan_jwt_secret';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h';
  // Esto es para firmar el token con la informacion del payload y la clave secreta.
  // El token es solo para el front, no para la base de datos, esto es para que el front pueda verificar que el usuario este autenticado y tenga permisos para acceder a ciertos recursos.
  // Entonces no pasamos el password_hash al token porque no es necesario y es una vulnerabilidad de seguridad.
  // Esto le permite al usuario poder ingresar al sistema de forma segura y que el front pueda validar su autenticacion y permisos para acceder a ciertos recursos.

  const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: jwtExpiresIn });

  // Retorno seguro SIN exponer password_hash
  // El front podra usar este token para hacer peticiones a la API y verificar que el usuario este autenticado y tenga permisos para acceder a ciertos recursos.
  // En el caso de authService, 
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }
  };
};

/**
 * Obtiene los datos del perfil de un usuario autenticado
 * @param {number} id
 * @returns {Promise<object>}
 */
const obtenerPerfil = async (id) => {
  const usuario = await prisma.usuarios.findUnique({
    where: { id: parseInt(id, 10) },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      created_at: true
    }
  });

  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return usuario;
};

module.exports = {
  login,
  obtenerPerfil
};
