/**
 * Servicio para gestión del catálogo de tipos de defecto con Prisma ORM
 * Proyecto: NutriScan - Calidad 4.0
 */

const prisma = require('../config/prisma');

/**
 * Obtiene todos los tipos de defectos, opcionalmente filtrados por tipo de envase
 * @param {string} [tipoEnvase] - 'FRASCO', 'LATA'
 * @returns {Promise<Array>} Lista de tipos de defecto
 */
const obtenerTiposDefecto = async (tipoEnvase) => {
  const where = {};

  if (tipoEnvase) {
    const envaseUpper = tipoEnvase.toUpperCase();
    where.OR = [
      { tipo_envase: envaseUpper },
      { tipo_envase: 'GENERAL' }
    ];
  }

  const tipos = await prisma.tipos_defecto.findMany({
    where,
    orderBy: { id: 'asc' }
  });

  return tipos;
};

/**
 * Obtiene un tipo de defecto por su ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
const obtenerPorId = async (id) => {
  const tipo = await prisma.tipos_defecto.findUnique({
    where: { id: parseInt(id, 10) }
  });

  return tipo;
};

/**
 * Obtiene un tipo de defecto por su código (ej: 'SIN_TAPA')
 * @param {string} codigo 
 * @returns {Promise<object|null>}
 */
const obtenerPorCodigo = async (codigo) => {
  const tipo = await prisma.tipos_defecto.findUnique({
    where: { codigo: codigo.toUpperCase().trim() }
  });

  return tipo;
};

/**
 * Crea un nuevo tipo de defecto en el catálogo (Solo ADMIN)
 * @param {object} param0
 * @returns {Promise<object>}
 */
const crearTipoDefecto = async ({ codigo, nombre, tipo_envase, severidad, descripcion }) => {
  const codigoUpper = codigo.toUpperCase().trim();

  const existente = await prisma.tipos_defecto.findUnique({
    where: { codigo: codigoUpper }
  });

  if (existente) {
    const error = new Error(`Ya existe un tipo de defecto con el código '${codigoUpper}'`);
    error.statusCode = 409;
    throw error;
  }

  const nuevo = await prisma.tipos_defecto.create({
    data: {
      codigo: codigoUpper,
      nombre: nombre.trim(),
      tipo_envase: tipo_envase.toUpperCase().trim(),
      severidad: severidad.toUpperCase().trim(),
      descripcion: descripcion ? descripcion.trim() : null
    }
  });

  return nuevo;
};

/**
 * Actualiza un tipo de defecto existente (Solo ADMIN)
 * @param {number} id
 * @param {object} param1
 * @returns {Promise<object>}
 */
const actualizarTipoDefecto = async (id, { codigo, nombre, tipo_envase, severidad, descripcion }) => {
  const parsedId = parseInt(id, 10);

  const existente = await prisma.tipos_defecto.findUnique({
    where: { id: parsedId }
  });

  if (!existente) {
    const error = new Error(`Tipo de defecto con ID ${parsedId} no encontrado`);
    error.statusCode = 404;
    throw error;
  }

  // Si se cambia el código, verificar que no colisione con otro
  if (codigo && codigo.toUpperCase().trim() !== existente.codigo) {
    const codigoDuplicado = await prisma.tipos_defecto.findUnique({
      where: { codigo: codigo.toUpperCase().trim() }
    });
    if (codigoDuplicado) {
      const error = new Error(`El código '${codigo.toUpperCase().trim()}' ya pertenece a otro defecto`);
      error.statusCode = 409;
      throw error;
    }
  }

  const actualizado = await prisma.tipos_defecto.update({
    where: { id: parsedId },
    data: {
      ...(codigo && { codigo: codigo.toUpperCase().trim() }),
      ...(nombre && { nombre: nombre.trim() }),
      ...(tipo_envase && { tipo_envase: tipo_envase.toUpperCase().trim() }),
      ...(severidad && { severidad: severidad.toUpperCase().trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion ? descripcion.trim() : null })
    }
  });

  return actualizado;
};

/**
 * Elimina un tipo de defecto del catálogo (Solo ADMIN)
 * @param {number} id
 * @returns {Promise<object>}
 */
const eliminarTipoDefecto = async (id) => {
  const parsedId = parseInt(id, 10);

  const existente = await prisma.tipos_defecto.findUnique({
    where: { id: parsedId },
    include: {
      _count: {
        select: { inspecciones: true }
      }
    }
  });

  if (!existente) {
    const error = new Error(`Tipo de defecto con ID ${parsedId} no encontrado`);
    error.statusCode = 404;
    throw error;
  }

  // Protección de integridad: no borrar defectos vinculados a inspecciones históricas
  if (existente._count.inspecciones > 0) {
    const error = new Error(`No se puede eliminar el defecto '${existente.codigo}' porque posee ${existente._count.inspecciones} inspección(es) asociada(s)`);
    error.statusCode = 400;
    throw error;
  }

  await prisma.tipos_defecto.delete({
    where: { id: parsedId }
  });

  return { message: `Tipo de defecto '${existente.codigo}' eliminado correctamente` };
};

module.exports = {
  obtenerTiposDefecto,
  obtenerPorId,
  obtenerPorCodigo,
  crearTipoDefecto,
  actualizarTipoDefecto,
  eliminarTipoDefecto
};
