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
  const where = {
    estado: { in: ['EN_PROCESO', 'PENDIENTE_CIERRE', 'DETENIDO'] }
  };

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
 * Cierre de lote iniciado por el Operario (o Supervisor) - Queda pendiente de aprobación
 * @param {number} id
 * @param {number} usuarioId
 * @returns {Promise<object>}
 */
const cerrarLote = async (id, usuarioId) => {
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

  if (loteExistente.estado === 'PENDIENTE_CIERRE') {
    const error = new Error(`El lote '${loteExistente.codigo_lote}' ya fue cerrado y está pendiente de aprobación de Supervisión`);
    error.statusCode = 400;
    throw error;
  }

  const loteActualizado = await prisma.lotes.update({
    where: { id: loteId },
    data: {
      estado: 'PENDIENTE_CIERRE'
    },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      }
    }
  });

  return loteActualizado;
};

/**
 * Finaliza un lote de producción (cierre de turno o visto bueno del supervisor)
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
    },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      }
    }
  });

  return loteActualizado;
};

/**
 * Detiene un lote de producción por parada de emergencia (OPERARIO, SUPERVISOR, ADMIN)
 * Pasa el estado a 'DETENIDO' y genera la alerta crítica operativa.
 * @param {number} id
 * @param {object} param1
 * @returns {Promise<object>}
 */
const detenerLote = async (id, { motivo, usuario_id } = {}) => {
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

  const motivoDetalle = motivo || 'Parada de emergencia reportada en línea de producción';

  // Buscar última inspección de este lote para asociar la alerta
  let ultimaInspeccion = await prisma.inspecciones.findFirst({
    where: { lote_id: loteId },
    orderBy: { id: 'desc' }
  });

  // Si no hay inspección previa, creamos una inspección representativa del evento de parada
  if (!ultimaInspeccion) {
    const defectoCritico = await prisma.tipos_defecto.findFirst({
      where: {
        OR: [
          { tipo_envase: loteExistente.tipo_envase },
          { tipo_envase: 'GENERAL' }
        ],
        severidad: 'CRITICA'
      }
    });

    ultimaInspeccion = await prisma.inspecciones.create({
      data: {
        lote_id: loteId,
        tipo_defecto_id: defectoCritico ? defectoCritico.id : null,
        usuario_id: usuario_id || loteExistente.usuario_creador_id,
        estado: 'RECHAZADO',
        observacion: `🚨 PARADA DE LÍNEA: ${motivoDetalle}`,
        imagen_url: `/simulador/parada_emergencia.png`
      }
    });
  }

  // Crear la alerta crítica vinculada al evento de parada
  const alertaCritica = await prisma.alertas.create({
    data: {
      inspeccion_id: ultimaInspeccion.id,
      nivel: 'CRITICA',
      mensaje: `🚨 PARADA DE LÍNEA [${loteExistente.codigo_lote}]: ${motivoDetalle}`,
      atendida: false
    }
  });

  // Transicionar lote a DETENIDO
  const loteActualizado = await prisma.lotes.update({
    where: { id: loteId },
    data: {
      estado: 'DETENIDO'
    },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      }
    }
  });

  return {
    lote: loteActualizado,
    alerta: alertaCritica
  };
};

/**
 * Reanuda un lote de producción detenido (Solo SUPERVISOR y ADMIN)
 * Vuelve el estado a 'EN_PROCESO' y marca como atendidas las alertas críticas del lote.
 * @param {number} id
 * @param {number} usuario_id
 * @returns {Promise<object>}
 */
const reanudarLote = async (id, usuario_id) => {
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

  // Resolver alertas críticas pendientes asociadas al lote
  const inspeccionesLote = await prisma.inspecciones.findMany({
    where: { lote_id: loteId },
    select: { id: true }
  });

  const inspeccionIds = inspeccionesLote.map(i => i.id);

  if (inspeccionIds.length > 0) {
    await prisma.alertas.updateMany({
      where: {
        inspeccion_id: { in: inspeccionIds },
        atendida: false
      },
      data: {
        atendida: true
      }
    });
  }

  // Devolver el estado a EN_PROCESO
  const loteActualizado = await prisma.lotes.update({
    where: { id: loteId },
    data: {
      estado: 'EN_PROCESO'
    },
    include: {
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      }
    }
  });

  return loteActualizado;
};

module.exports = {
  crearLote,
  obtenerLotes,
  obtenerLoteActivo,
  obtenerPorId,
  cerrarLote,
  finalizarLote,
  detenerLote,
  reanudarLote
};
