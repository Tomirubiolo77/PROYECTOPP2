/**
 * Servicio de Lógica de Inspecciones de Calidad y Disparo de Alertas
 * Proyecto: NutriScan - Calidad 4.0
 * Lógica transaccional: Registro de inspección y generación atómica de alertas ante defectos.
 */

const prisma = require('../config/prisma');

/**
 * Registra una inspección de calidad de forma transaccional
 * Si la pieza es rechazada, genera automáticamente la alerta correspondiente.
 * @param {object} param0
 * @returns {Promise<object>} Inspección registrada con datos de alerta (si aplica)
 */
const registrarInspeccion = async ({
  lote_id,
  tipo_defecto_id,
  usuario_id,
  estado,
  imagen_url,
  observacion
}) => {
  // 1. Validar existencia y vigencia operativa del lote
  const lote = await prisma.lotes.findUnique({
    where: { id: lote_id }
  });

  if (!lote) {
    const error = new Error(`El lote con ID ${lote_id} no existe`);
    error.statusCode = 404;
    throw error;
  }

  if (lote.estado !== 'EN_PROCESO') {
    const error = new Error(`No se pueden registrar inspecciones en el lote '${lote.codigo_lote}' porque su estado actual es: ${lote.estado}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Si es rechazada, validar el tipo de defecto
  let defecto = null;
  if (estado === 'RECHAZADO') {
    if (!tipo_defecto_id) {
      const error = new Error('Las inspecciones rechazadas requieren especificar el tipo_defecto_id');
      error.statusCode = 400;
      throw error;
    }

    defecto = await prisma.tipos_defecto.findUnique({
      where: { id: tipo_defecto_id }
    });

    if (!defecto) {
      const error = new Error(`El tipo de defecto con ID ${tipo_defecto_id} no existe en el catálogo`);
      error.statusCode = 404;
      throw error;
    }

    // Validación de compatibilidad entre tipo de envase del defecto y del lote
    if (defecto.tipo_envase !== 'GENERAL' && defecto.tipo_envase !== lote.tipo_envase) {
      const error = new Error(`Incompatibilidad de envase: El defecto '${defecto.codigo}' aplica a '${defecto.tipo_envase}', pero el lote es '${lote.tipo_envase}'`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Ejecución Transaccional Atómica con Prisma
  const resultadoTransaccion = await prisma.$transaction(async (tx) => {
    // A. Crear registro de inspección
    const nuevaInspeccion = await tx.inspecciones.create({
      data: {
        lote_id,
        tipo_defecto_id: estado === 'RECHAZADO' ? tipo_defecto_id : null,
        usuario_id,
        estado,
        imagen_url: imagen_url || null,
        observacion: observacion || null
      }
    });

    let alertaGenerada = null;

    // B. Si es RECHAZADO, disparar registro en tabla 'alertas'
    if (estado === 'RECHAZADO') {
      const nivelAlerta = defecto.severidad === 'CRITICA' ? 'CRITICA' : 'WARN';
      const mensajeAlerta = `Falla detectada [${defecto.codigo}] ${defecto.nombre} en ${lote.tipo_envase} (Lote: ${lote.codigo_lote})`;

      alertaGenerada = await tx.alertas.create({
        data: {
          inspeccion_id: nuevaInspeccion.id,
          nivel: nivelAlerta,
          mensaje: mensajeAlerta,
          atendida: false
        }
      });
    }

    return {
      ...nuevaInspeccion,
      alerta: alertaGenerada
    };
  });

  // Retornar detalle enriquecido
  const inspeccionCompleta = await prisma.inspecciones.findUnique({
    where: { id: resultadoTransaccion.id },
    include: {
      lotes: {
        select: { id: true, codigo_lote: true, producto: true, tipo_envase: true }
      },
      tipos_defecto: {
        select: { id: true, codigo: true, nombre: true, severidad: true }
      },
      usuarios: {
        select: { id: true, nombre: true, rol: true }
      },
      alertas: true
    }
  });

  return inspeccionCompleta;
};

/**
 * Consulta el historial de inspecciones de un lote junto con su resumen estadístico
 * (Optimizado para la pantalla del Operario y Supervisor)
 * @param {number} loteId
 * @param {object} opciones
 * @returns {Promise<object>}
 */
const obtenerHistorialPorLote = async (loteId, { estado, limit = 50, offset = 0 } = {}) => {
  const parsedLoteId = parseInt(loteId, 10);

  // Verificar que el lote exista
  const lote = await prisma.lotes.findUnique({
    where: { id: parsedLoteId }
  });

  if (!lote) {
    const error = new Error(`Lote con ID ${parsedLoteId} no encontrado`);
    error.statusCode = 404;
    throw error;
  }

  const where = { lote_id: parsedLoteId };
  if (estado) {
    where.estado = estado.toUpperCase();
  }

  const [inspecciones, totalLote, totalAprobadas, totalRechazadas] = await Promise.all([
    prisma.inspecciones.findMany({
      where,
      orderBy: { id: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      include: {
        tipos_defecto: {
          select: { id: true, codigo: true, nombre: true, severidad: true }
        },
        usuarios: {
          select: { id: true, nombre: true, rol: true }
        },
        alertas: true
      }
    }),
    prisma.inspecciones.count({ where: { lote_id: parsedLoteId } }),
    prisma.inspecciones.count({ where: { lote_id: parsedLoteId, estado: 'APROBADO' } }),
    prisma.inspecciones.count({ where: { lote_id: parsedLoteId, estado: 'RECHAZADO' } })
  ]);

  const tasaDefecto = totalLote > 0
    ? Number(((totalRechazadas / totalLote) * 100).toFixed(2))
    : 0;

  return {
    lote: {
      id: lote.id,
      codigo_lote: lote.codigo_lote,
      producto: lote.producto,
      tipo_envase: lote.tipo_envase,
      estado: lote.estado
    },
    resumen_estadistico: {
      total_unidades: totalLote,
      unidades_aprobadas: totalAprobadas,
      unidades_rechazadas: totalRechazadas,
      tasa_defecto_porcentaje: tasaDefecto
    },
    inspecciones
  };
};

/**
 * Consulta global de inspecciones con filtros para Supervisores y Administradores
 * @param {object} filtros
 * @returns {Promise<Array>}
 */
const obtenerInspecciones = async ({ lote_id, estado, limit = 50, offset = 0 } = {}) => {
  const where = {};

  if (lote_id) where.lote_id = parseInt(lote_id, 10);
  if (estado) where.estado = estado.toUpperCase();

  const [inspecciones, total] = await Promise.all([
    prisma.inspecciones.findMany({
      where,
      orderBy: { id: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      include: {
        lotes: {
          select: { id: true, codigo_lote: true, producto: true, tipo_envase: true }
        },
        tipos_defecto: {
          select: { id: true, codigo: true, nombre: true, severidad: true }
        },
        usuarios: {
          select: { id: true, nombre: true, rol: true }
        },
        alertas: true
      }
    }),
    prisma.inspecciones.count({ where })
  ]);

  return {
    total,
    count: inspecciones.length,
    inspecciones
  };
};

/**
 * Obtiene el detalle de una inspección por ID
 * @param {number} id
 * @returns {Promise<object>}
 */
const obtenerPorId = async (id) => {
  const inspeccion = await prisma.inspecciones.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      lotes: true,
      tipos_defecto: true,
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true }
      },
      alertas: true
    }
  });

  if (!inspeccion) {
    const error = new Error(`Inspección con ID ${id} no encontrada`);
    error.statusCode = 404;
    throw error;
  }

  return inspeccion;
};

module.exports = {
  registrarInspeccion,
  obtenerHistorialPorLote,
  obtenerInspecciones,
  obtenerPorId
};
