/**
 * Middlewares de Validación y Sanitización de Payloads
 * Proyecto: NutriScan - Calidad 4.0
 * Seguridad: Validación de tipos, enums y estructuras para prevenir inyecciones y fallos de lógica.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENUM_ENVASES = ['FRASCO', 'LATA'];
const ENUM_ESTADOS_INSPECCION = ['APROBADO', 'RECHAZADO'];
const ENUM_SEVERIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const ENUM_ENVASES_DEFECTO = ['FRASCO', 'LATA', 'GENERAL'];

/**
 * Validador para inicio de sesión
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Formato de correo electrónico inválido o ausente'
    });
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña es requerida y no puede estar vacía'
    });
  }

  // Sanitización
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validador para creación de lote
 */
const validateCrearLote = (req, res, next) => {
  const { codigo_lote, producto, tipo_envase } = req.body;

  if (!codigo_lote || typeof codigo_lote !== 'string' || codigo_lote.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'El campo codigo_lote es requerido y debe tener al menos 3 caracteres'
    });
  }

  if (!producto || typeof producto !== 'string' || producto.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'El campo producto es requerido y debe tener al menos 3 caracteres'
    });
  }

  if (!tipo_envase || !ENUM_ENVASES.includes(String(tipo_envase).toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `El campo tipo_envase es inválido. Valores permitidos: [${ENUM_ENVASES.join(', ')}]`
    });
  }

  req.body.codigo_lote = codigo_lote.trim().toUpperCase();
  req.body.producto = producto.trim();
  req.body.tipo_envase = String(tipo_envase).toUpperCase();
  next();
};

/**
 * Validador para registro de inspección
 */
const validateCrearInspeccion = (req, res, next) => {
  const { lote_id, estado, tipo_defecto_id, observacion, imagen_url } = req.body;

  if (!lote_id || isNaN(parseInt(lote_id, 10))) {
    return res.status(400).json({
      success: false,
      error: 'El campo lote_id es requerido y debe ser un número entero válido'
    });
  }

  if (!estado || !ENUM_ESTADOS_INSPECCION.includes(String(estado).toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `El campo estado es inválido. Valores permitidos: [${ENUM_ESTADOS_INSPECCION.join(', ')}]`
    });
  }

  const estadoNormalizado = String(estado).toUpperCase();

  // Si la inspección es RECHAZADO, debe indicarse la tipología del defecto
  if (estadoNormalizado === 'RECHAZADO') {
    if (!tipo_defecto_id || isNaN(parseInt(tipo_defecto_id, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Para inspecciones RECHAZADAS se requiere especificar un tipo_defecto_id válido'
      });
    }
  }

  req.body.lote_id = parseInt(lote_id, 10);
  req.body.estado = estadoNormalizado;
  req.body.tipo_defecto_id = tipo_defecto_id ? parseInt(tipo_defecto_id, 10) : null;
  if (observacion) req.body.observacion = String(observacion).trim().slice(0, 255);
  if (imagen_url) req.body.imagen_url = String(imagen_url).trim().slice(0, 255);

  next();
};

/**
 * Validador para creación/edición de catálogo de tipos de defecto
 */
const validateTipoDefecto = (req, res, next) => {
  const { codigo, nombre, tipo_envase, severidad, descripcion } = req.body;

  if (!codigo || typeof codigo !== 'string' || codigo.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'El campo codigo es obligatorio (mínimo 2 caracteres)'
    });
  }

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'El campo nombre es obligatorio (mínimo 3 caracteres)'
    });
  }

  if (!tipo_envase || !ENUM_ENVASES_DEFECTO.includes(String(tipo_envase).toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `El campo tipo_envase es inválido. Valores permitidos: [${ENUM_ENVASES_DEFECTO.join(', ')}]`
    });
  }

  if (!severidad || !ENUM_SEVERIDADES.includes(String(severidad).toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `El campo severidad es inválido. Valores permitidos: [${ENUM_SEVERIDADES.join(', ')}]`
    });
  }

  req.body.codigo = codigo.trim().toUpperCase();
  req.body.nombre = nombre.trim();
  req.body.tipo_envase = String(tipo_envase).toUpperCase();
  req.body.severidad = String(severidad).toUpperCase();
  if (descripcion) req.body.descripcion = String(descripcion).trim().slice(0, 255);

  next();
};

module.exports = {
  validateLogin,
  validateCrearLote,
  validateCrearInspeccion,
  validateTipoDefecto
};
