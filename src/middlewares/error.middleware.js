/**
 * Middleware Centralizado de Manejo de Errores y Prevención de Fugas de Información
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: OWASP Top 10 - Evitar filtraciones de detalles de infraestructura, SQL y stack traces.
 */

const errorHandler = (err, req, res, next) => {
  // Registro seguro del error en los logs del servidor
  console.error(`💥 [ERROR] [${req.method} ${req.originalUrl}] Message:`, err.message);

  // Errores conocidos de Prisma ORM
  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target ? err.meta.target.join(', ') : 'campo único';
        return res.status(409).json({
          success: false,
          error: `Conflicto de duplicidad: Ya existe un registro con ese valor en: ${target}`
        });
      }
      case 'P2025': {
        return res.status(404).json({
          success: false,
          error: 'El recurso solicitado no fue encontrado en la base de datos'
        });
      }
      case 'P2003': {
        return res.status(400).json({
          success: false,
          error: 'Violación de restricción de clave foránea: El registro referenciado no existe o no puede modificarse'
        });
      }
      default:
        break;
    }
  }

  // Errores de sintaxis en JSON entrante
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Formato JSON inválido en el cuerpo de la solicitud'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 && !isDevelopment
      ? 'Ocurrió un error interno en el servidor. Por favor contacte al administrador.'
      : err.message || 'Error interno del servidor',
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
