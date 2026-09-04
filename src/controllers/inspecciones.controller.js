/**
 * Controlador de Inspecciones de Calidad
 * Proyecto: NutriScan - Calidad 4.0
 */

const inspeccionesService = require('../services/inspecciones.service');

/**
 * POST /api/inspecciones - Registrar un evento de inspección (OPERARIO, SUPERVISOR, ADMIN)
 */
const registrarInspeccion = async (req, res, next) => {
  try {
    const { lote_id, tipo_defecto_id, estado, imagen_url, observacion } = req.body;

    const inspeccion = await inspeccionesService.registrarInspeccion({
      lote_id,
      tipo_defecto_id,
      usuario_id: req.user.id, // Se toma de la sesión validada por JWT (anti-spoofing)
      estado,
      imagen_url,
      observacion
    });

    return res.status(201).json({
      success: true,
      message: estado === 'RECHAZADO'
        ? 'Inspección rechazada registrada y alerta generada automáticamente'
        : 'Inspección conforme registrada exitosamente',
      data: inspeccion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inspecciones/lote/:loteId - Historial e indicadores en tiempo real de un lote
 */
const historialPorLote = async (req, res, next) => {
  try {
    const { loteId } = req.params;
    const { estado, limit, offset } = req.query;

    const data = await inspeccionesService.obtenerHistorialPorLote(loteId, {
      estado,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inspecciones - Listado general con paginación (SUPERVISOR, ADMIN)
 */
const listarInspecciones = async (req, res, next) => {
  try {
    const { lote_id, estado, limit, offset } = req.query;

    const resultado = await inspeccionesService.obtenerInspecciones({
      lote_id,
      estado,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inspecciones/:id - Detalle por ID
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const inspeccion = await inspeccionesService.obtenerPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: inspeccion
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrarInspeccion,
  historialPorLote,
  listarInspecciones,
  obtenerPorId
};
