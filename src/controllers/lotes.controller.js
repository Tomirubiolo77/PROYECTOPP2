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
 * PATCH /api/lotes/:id/cerrar - Cierre de lote por operario (pasa a PENDIENTE_CIERRE)
 */
const cerrarLote = async (req, res, next) => {
  try {
    const loteCerrado = await lotesService.cerrarLote(req.params.id, req.user?.id);

    return res.status(200).json({
      success: true,
      message: `Lote '${loteCerrado.codigo_lote}' cerrado por el operario. En espera de visto bueno de Supervisión.`,
      data: loteCerrado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/lotes/:id/finalizar - Cerrar lote de producción / Visto bueno final
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

/**
 * PATCH /api/lotes/:id/detener - Detener lote por parada de emergencia (OPERARIO, SUPERVISOR, ADMIN)
 */
const detenerLote = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const resultado = await lotesService.detenerLote(req.params.id, {
      motivo,
      usuario_id: req.user?.id
    });

    return res.status(200).json({
      success: true,
      message: `Línea de producción detenida por emergencia en lote '${resultado.lote.codigo_lote}'`,
      data: resultado.lote,
      alerta: resultado.alerta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/lotes/:id/reanudar - Reanudar lote detenido (Solo SUPERVISOR y ADMIN)
 */
const reanudarLote = async (req, res, next) => {
  try {
    const loteReanudado = await lotesService.reanudarLote(req.params.id, req.user?.id);

    return res.status(200).json({
      success: true,
      message: `Línea reanudada exitosamente por el Supervisor en lote '${loteReanudado.codigo_lote}'`,
      data: loteReanudado
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
  cerrarLote,
  finalizarLote,
  detenerLote,
  reanudarLote
};
