/**
 * Controlador para el Catálogo de Tipos de Defecto
 * Proyecto: NutriScan - Calidad 4.0
 */

const tiposDefectoService = require('../services/tiposDefecto.service');

/**
 * GET /api/tipos-defecto - Listar tipos de defecto
 */
const listar = async (req, res, next) => {
  try {
    const { tipo_envase } = req.query;

    if (tipo_envase) {
      const normalizado = tipo_envase.toUpperCase();
      if (!['FRASCO', 'LATA'].includes(normalizado)) {
        return res.status(400).json({
          success: false,
          error: "Parámetro 'tipo_envase' inválido. Debe ser 'FRASCO' o 'LATA'"
        });
      }
    }

    const tipos = await tiposDefectoService.obtenerTiposDefecto(tipo_envase);

    return res.status(200).json({
      success: true,
      count: tipos.length,
      data: tipos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tipos-defecto/:id - Obtener tipo de defecto por ID
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return res.status(400).json({
        success: false,
        error: "El parámetro 'id' debe ser un número entero válido"
      });
    }

    const tipo = await tiposDefectoService.obtenerPorId(idNum);

    if (!tipo) {
      return res.status(404).json({
        success: false,
        error: `Tipo de defecto con ID ${idNum} no encontrado`
      });
    }

    return res.status(200).json({
      success: true,
      data: tipo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tipos-defecto - Crear nuevo tipo de defecto (Solo ADMIN)
 */
const crear = async (req, res, next) => {
  try {
    const { codigo, nombre, tipo_envase, severidad, descripcion } = req.body;
    const nuevoDefecto = await tiposDefectoService.crearTipoDefecto({
      codigo,
      nombre,
      tipo_envase,
      severidad,
      descripcion
    });

    return res.status(201).json({
      success: true,
      message: 'Tipo de defecto creado exitosamente',
      data: nuevoDefecto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tipos-defecto/:id - Actualizar tipo de defecto (Solo ADMIN)
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, tipo_envase, severidad, descripcion } = req.body;

    const actualizado = await tiposDefectoService.actualizarTipoDefecto(id, {
      codigo,
      nombre,
      tipo_envase,
      severidad,
      descripcion
    });

    return res.status(200).json({
      success: true,
      message: 'Tipo de defecto actualizado exitosamente',
      data: actualizado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tipos-defecto/:id - Eliminar tipo de defecto (Solo ADMIN)
 */
const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await tiposDefectoService.eliminarTipoDefecto(id);

    return res.status(200).json({
      success: true,
      message: resultado.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
