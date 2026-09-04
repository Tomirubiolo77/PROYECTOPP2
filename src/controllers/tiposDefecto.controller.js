/**
 * Controlador para la API de Tipos de Defecto
 * Proyecto: NutriScan - Calidad 4.0
 */

const tiposDefectoService = require('../services/tiposDefecto.service');

/**
 * Lista todos los tipos de defecto registrados en el catálogo maestro
 * GET /api/tipos-defecto
 * Query Params opcionales: ?tipo_envase=FRASCO|LATA
 */
const listarTiposDefecto = async (req, res, next) => {
  try {
    const { tipo_envase } = req.query;

    if (tipo_envase) {
      const tipoNormalizado = tipo_envase.toUpperCase();
      if (!['FRASCO', 'LATA', 'GENERAL'].includes(tipoNormalizado)) {
        return res.status(400).json({
          success: false,
          error: `Parámetro 'tipo_envase' inválido: '${tipo_envase}'. Valores permitidos: 'FRASCO', 'LATA'`
        });
      }
    }

    const defectos = await tiposDefectoService.obtenerTiposDefecto(tipo_envase);

    return res.status(200).json({
      success: true,
      count: defectos.length,
      filtro: tipo_envase ? tipo_envase.toUpperCase() : 'TODOS',
      data: defectos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el detalle de un tipo de defecto por su ID
 * GET /api/tipos-defecto/:id
 */
const obtenerTipoDefectoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNumerico = parseInt(id, 10);

    if (isNaN(idNumerico)) {
      return res.status(400).json({
        success: false,
        error: 'El ID proporcionado debe ser un número entero válido.'
      });
    }

    const defecto = await tiposDefectoService.obtenerPorId(idNumerico);

    if (!defecto) {
      return res.status(404).json({
        success: false,
        error: `Tipo de defecto con ID ${id} no encontrado en el catálogo.`
      });
    }

    return res.status(200).json({
      success: true,
      data: defecto
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarTiposDefecto,
  obtenerTipoDefectoPorId
};
