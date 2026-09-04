/**
 * Servicio de Gestión y Seguimiento de Alertas Operativas
 * Proyecto: NutriScan - Calidad 4.0
 */

const prisma = require('../config/prisma');

/**
 * Lista alertas con filtros opcionales (atendida, nivel)
 * @param {object} param0
 * @returns {Promise<Array>}
 */
const obtenerAlertas = async ({ atendida, nivel, limit = 50, offset = 0 } = {}) => {
  const where = {};

  if (atendida !== undefined) {
    where.atendida = String(atendida) === 'true';
  }

  if (nivel) {
    where.nivel = nivel.toUpperCase();
  }

  const [alertas, total] = await Promise.all([
    prisma.alertas.findMany({
      where,
      orderBy: { id: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      include: {
        inspecciones: {
          include: {
            lotes: {
              select: { id: true, codigo_lote: true, producto: true, tipo_envase: true }
            },
            tipos_defecto: {
              select: { id: true, codigo: true, nombre: true, severidad: true }
            },
            usuarios: {
              select: { id: true, nombre: true, rol: true }
            }
          }
        }
      }
    }),
    prisma.alertas.count({ where })
  ]);

  return {
    total,
    count: alertas.length,
    alertas
  };
};

/**
 * Obtiene métricas agregadas de alertas para tableros de control
 * @returns {Promise<object>}
 */
const obtenerMetricasAlertas = async () => {
  const [total, noAtendidas, criticas, advertencias] = await Promise.all([
    prisma.alertas.count(),
    prisma.alertas.count({ where: { atendida: false } }),
    prisma.alertas.count({ where: { nivel: 'CRITICA', atendida: false } }),
    prisma.alertas.count({ where: { nivel: 'WARN', atendida: false } })
  ]);

  return {
    total_alertas: total,
    alertas_pendientes: noAtendidas,
    alertas_criticas_pendientes: criticas,
    alertas_advertencia_pendientes: advertencias,
    alertas_resueltas: total - noAtendidas
  };
};

/**
 * Obtiene una alerta por su ID
 * @param {number} id
 * @returns {Promise<object>}
 */
const obtenerPorId = async (id) => {
  const alerta = await prisma.alertas.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      inspecciones: {
        include: {
          lotes: true,
          tipos_defecto: true,
          usuarios: {
            select: { id: true, nombre: true, email: true, rol: true }
          }
        }
      }
    }
  });

  if (!alerta) {
    const error = new Error(`Alerta con ID ${id} no encontrada`);
    error.statusCode = 404;
    throw error;
  }

  return alerta;
};

/**
 * Marca una alerta como atendida / resuelta (SUPERVISOR, ADMIN)
 * @param {number} id
 * @returns {Promise<object>}
 */
const atenderAlerta = async (id) => {
  const parsedId = parseInt(id, 10);

  const alertaExistente = await prisma.alertas.findUnique({
    where: { id: parsedId }
  });

  if (!alertaExistente) {
    const error = new Error(`Alerta con ID ${parsedId} no encontrada`);
    error.statusCode = 404;
    throw error;
  }

  const actualizada = await prisma.alertas.update({
    where: { id: parsedId },
    data: {
      atendida: true
    }
  });

  return actualizada;
};

/**
 * Edita o actualiza el mensaje / nivel de una alerta (Solo ADMIN)
 * @param {number} id
 * @param {object} param1
 * @returns {Promise<object>}
 */
const actualizarAlerta = async (id, { mensaje, nivel, atendida }) => {
  const parsedId = parseInt(id, 10);

  const alertaExistente = await prisma.alertas.findUnique({
    where: { id: parsedId }
  });

  if (!alertaExistente) {
    const error = new Error(`Alerta con ID ${parsedId} no encontrada`);
    error.statusCode = 404;
    throw error;
  }

  const data = {};
  if (mensaje) data.mensaje = mensaje.trim();
  if (nivel) data.nivel = nivel.toUpperCase();
  if (atendida !== undefined) data.atendida = Boolean(atendida);

  const actualizada = await prisma.alertas.update({
    where: { id: parsedId },
    data
  });

  return actualizada;
};

module.exports = {
  obtenerAlertas,
  obtenerMetricasAlertas,
  obtenerPorId,
  atenderAlerta,
  actualizarAlerta
};
