/**
 * Controlador de Lotes de Producción
 * Proyecto: NutriScan - Calidad 4.0
 */

const lotesService = require('../services/lotes.service');

/**
 * POST /api/lotes - Crear nuevo lote (SUPERVISOR, ADMIN)
 */
const crearLote = async (req, res, next) => {
  try {
    const { codigo_lote, producto, tipo_envase } = req.body;
    const nuevoLote = await lotesService.crearLote({
      codigo_lote,
      producto,
      tipo_envase,
      usuario_creador_id: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Lote creado exitosamente',
      data: nuevoLote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lotes - Listar lotes con filtros
 */
const listarLotes = async (req, res, next) => {
  try {
    const { estado, tipo_envase } = req.query;
    const lotes = await lotesService.obtenerLotes({ estado, tipo_envase });

    return res.status(200).json({
      success: true,
      count: lotes.length,
      data: lotes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lotes/activo - Obtener lote activo actual (para operarios y supervisores)
 */
const obtenerLoteActivo = async (req, res, next) => {
  try {
    const { tipo_envase } = req.query;
    const loteActivo = await lotesService.obtenerLoteActivo(tipo_envase);

    if (!loteActivo) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No hay ningún lote en proceso actualmente para la línea seleccionada'
      });
    }

    return res.status(200).json({
      success: true,
      data: loteActivo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lotes/:id - Obtener lote por ID
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const lote = await lotesService.obtenerPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: lote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/lotes/:id/finalizar - Cerrar lote de producción
 */
const finalizarLote = async (req, res, next) => {
  try {
    const loteFinalizado = await lotesService.finalizarLote(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Lote '${loteFinalizado.codigo_lote}' finalizado correctamente`,
      data: loteFinalizado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearLote,
  listarLotes,
  obtenerLoteActivo,
  obtenerPorId,
  finalizarLote
};
