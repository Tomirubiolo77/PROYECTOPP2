/**
 * Middleware de Control de Acceso Basado en Roles (RBAC)
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: Principio de menor privilegio y prevención de escalamiento de privilegios.
 */

/**
 * Genera un middleware que restringe el acceso a roles específicos
 * @param  {...string} rolesPermitidos - Lista de roles permitidos ('OPERARIO', 'SUPERVISOR', 'ADMIN')
 */
const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Comprobación de que el usuario ya haya sido autenticado
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado: Se requiere una sesión activa para verificar permisos'
      });
    }

    // Verificación de si el rol del usuario figura entre los permitidos
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: El rol '${req.user.rol}' no tiene permisos para realizar esta operación. Roles requeridos: [${rolesPermitidos.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
