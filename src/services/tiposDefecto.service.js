/**
 * Servicio para gestión del catálogo de tipos de defecto
 * Proyecto: NutriScan - Calidad 4.0
 */

const db = require('../config/db');

/**
 * Obtiene todos los tipos de defectos, opcionalmente filtrados por tipo de envase
 * @param {string} [tipoEnvase] - 'FRASCO', 'LATA'
 * @returns {Promise<Array>} Lista de tipos de defecto
 */
const obtenerTiposDefecto = async (tipoEnvase) => {
  let queryText = 'SELECT id, codigo, nombre, tipo_envase, severidad, descripcion FROM tipos_defecto';
  const params = [];

  if (tipoEnvase) {
    queryText += ' WHERE tipo_envase = $1 OR tipo_envase = $2';
    params.push(tipoEnvase.toUpperCase(), 'GENERAL');
  }

  queryText += ' ORDER BY id ASC';

  const result = await db.query(queryText, params);
  return result.rows;
};

/**
 * Obtiene un tipo de defecto por su ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
const obtenerPorId = async (id) => {
  const result = await db.query(
    'SELECT id, codigo, nombre, tipo_envase, severidad, descripcion FROM tipos_defecto WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Obtiene un tipo de defecto por su código nemotécnico (ej: 'SIN_TAPA')
 * @param {string} codigo 
 * @returns {Promise<object|null>}
 */
const obtenerPorCodigo = async (codigo) => {
  const result = await db.query(
    'SELECT id, codigo, nombre, tipo_envase, severidad, descripcion FROM tipos_defecto WHERE codigo = $1',
    [codigo.toUpperCase()]
  );
  return result.rows[0] || null;
};

module.exports = {
  obtenerTiposDefecto,
  obtenerPorId,
  obtenerPorCodigo
};
