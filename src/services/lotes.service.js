/**
 * Servicio de Gestión de Lotes de Producción
 * Proyecto: NutriScan - Calidad 4.0
 */

const prisma = require('../config/prisma');

/**
 * Crea un nuevo lote de producción
 * @param {object} param0
 * @returns {Promise<object>} Lote creado
 */
const crearLote = async ({ codigo_lote, producto, tipo_envase, usuario_creador_id }) => {
  // Comprobar si ya existe un lote con el mismo código
  const loteExistente = await prisma.lotes.findUnique({
    where: { codigo_lote }
  });

  if (loteExistente) {
    const error = new Error(`Ya existe un lote registrado con el código '${codigo_lote}'`);
    error.statusCode = 409;
    throw error;
  }

  const nuevoLote = await prisma.lotes.create({
    data: {
      codigo_lote,
      producto,
      tipo_envase,
      estado: 'EN_PROCESO',
      usuario_creador_id
    },
    include: {
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true }
      }
    }
  });

  return nuevoLote;
};

/**
 * Lista lotes con filtros opcionales (estado, tipo_envase)
 * @param {object} filtros
 * @returns {Promise<Array>}
 */
const obtenerLotes = async ({ estado, tipo_envase } = {}) => {
  const where = {};

  if (estado) {
    where.estado = estado.toUpperCase();
  }

  if (tipo_envase) {
    where.tipo_envase = tipo_envase.toUpperCase();
  }

  const lotes = await prisma.lotes.findMany({
    where,
    orderBy: { id: 'desc' },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      },
      _count: {
        select: { inspecciones: true }
      }
    }
  });

  return lotes;
};

/**
 * Obtiene el lote activo ('EN_PROCESO') actual en línea, opcionalmente filtrado por tipo de envase
 * @param {string} [tipo_envase]
 * @returns {Promise<object|null>}
 */
const obtenerLoteActivo = async (tipo_envase) => {
  const where = { estado: 'EN_PROCESO' };

  if (tipo_envase) {
    where.tipo_envase = tipo_envase.toUpperCase();
  }

  const lote = await prisma.lotes.findFirst({
    where,
    orderBy: { id: 'desc' },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      }
    }
  });

  if (!lote) return null;

  // Cálculo de estadísticas en tiempo real para el operario/supervisor
  const totalInspecciones = await prisma.inspecciones.count({
    where: { lote_id: lote.id }
  });

  const totalAprobadas = await prisma.inspecciones.count({
    where: { lote_id: lote.id, estado: 'APROBADO' }
  });

  const totalRechazadas = await prisma.inspecciones.count({
    where: { lote_id: lote.id, estado: 'RECHAZADO' }
  });

  const tasaDefecto = totalInspecciones > 0
    ? Number(((totalRechazadas / totalInspecciones) * 100).toFixed(2))
    : 0;

  return {
    ...lote,
    estadisticas: {
      total_inspecciones: totalInspecciones,
      total_aprobadas: totalAprobadas,
      total_rechazadas: totalRechazadas,
      tasa_defecto_porcentaje: tasaDefecto
    }
  };
};

/**
 * Obtiene el detalle de un lote por su ID
 * @param {number} id
 * @returns {Promise<object>}
 */
const obtenerPorId = async (id) => {
  const lote = await prisma.lotes.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true }
      }
    }
  });

  if (!lote) {
    const error = new Error(`Lote con ID ${id} no encontrado`);
    error.statusCode = 404;
    throw error;
  }

  return lote;
};

/**
 * Finaliza un lote de producción (cierre de turno o partida)
 * @param {number} id
 * @returns {Promise<object>}
 */
const finalizarLote = async (id) => {
  const loteId = parseInt(id, 10);

  const loteExistente = await prisma.lotes.findUnique({
    where: { id: loteId }
  });

  if (!loteExistente) {
    const error = new Error(`Lote con ID ${loteId} no encontrado`);
    error.statusCode = 404;
    throw error;
  }

  if (loteExistente.estado === 'FINALIZADO') {
    const error = new Error(`El lote '${loteExistente.codigo_lote}' ya se encuentra finalizado`);
    error.statusCode = 400;
    throw error;
  }

  const loteActualizado = await prisma.lotes.update({
    where: { id: loteId },
    data: {
      estado: 'FINALIZADO',
      fecha_fin: new Date()
    }
  });

  return loteActualizado;
};

module.exports = {
  crearLote,
  obtenerLotes,
  obtenerLoteActivo,
  obtenerPorId,
  finalizarLote
};
