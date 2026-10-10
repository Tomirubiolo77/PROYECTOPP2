/**
 * Servicio de Inteligencia Operativa, Agregaciones SQL y Analítica
 * Proyecto: NutriScan - Calidad 4.0 (Semana 08)
 * 
 * Este servicio resuelve todas las consultas analíticas mediante SQL optimizado (PostgreSQL en Neon Cloud),
 * delegando los cálculos matemáticos, agrupaciones y agregaciones al motor de base de datos.
 */

const { query } = require('../config/db');

/**
 * Genera cláusulas WHERE parametrizadas de forma segura para filtros multidimensionales
 * @param {object} param0 
 * @returns {{ whereClause: string, params: Array }}
 */
const buildWhereFilters = ({ lote_id, tipo_envase, fecha_desde, fecha_hasta }) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (lote_id) {
    conditions.push(`i.lote_id = $${paramIndex++}`);
    params.push(parseInt(lote_id, 10));
  }

  if (tipo_envase) {
    conditions.push(`l.tipo_envase = $${paramIndex++}`);
    params.push(tipo_envase.toUpperCase());
  }

  if (fecha_desde) {
    conditions.push(`i.fecha_hora >= $${paramIndex++}`);
    params.push(new Date(fecha_desde).toISOString());
  }

  if (fecha_hasta) {
    conditions.push(`i.fecha_hora <= $${paramIndex++}`);
    params.push(new Date(fecha_hasta).toISOString());
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

/**
 * GET /api/dashboard/kpis
 * Obtiene métricas globales del proceso: total procesado, aprobados, rechazados,
 * tasa de descarte (%), tasa de aprobación (%) y tiempo promedio de ciclo (seg).
 * @param {object} filtros
 * @returns {Promise<object>}
 */
const obtenerKpis = async (filtros = {}) => {
  const { whereClause, params } = buildWhereFilters(filtros);

  const sql = `
    WITH inspecciones_filtradas AS (
      SELECT 
        i.id,
        i.lote_id,
        i.estado,
        i.fecha_hora,
        LAG(i.fecha_hora) OVER (PARTITION BY i.lote_id ORDER BY i.fecha_hora) AS lag_fecha
      FROM inspecciones i
      JOIN lotes l ON i.lote_id = l.id
      WHERE 1=1 ${whereClause}
    )
    SELECT 
      COUNT(*)::int AS total_procesado,
      COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END)::int AS aprobados,
      COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END)::int AS rechazados,
      ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END)::numeric / COUNT(*)::numeric) * 100 
          ELSE 0 
        END, 2
      )::float AS tasa_descarte,
      ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END)::numeric / COUNT(*)::numeric) * 100 
          ELSE 0 
        END, 2
      )::float AS tasa_aprobacion,
      COALESCE(
        ROUND(
          AVG(
            NULLIF(EXTRACT(EPOCH FROM (fecha_hora - lag_fecha)), 0)
          )::numeric, 1
        )::float,
        1.8
      ) AS tiempo_promedio_seg
    FROM inspecciones_filtradas;
  `;

  const res = await query(sql, params);
  const row = res.rows[0] || {};

  return {
    total_procesado: row.total_procesado || 0,
    aprobados: row.aprobados || 0,
    rechazados: row.rechazados || 0,
    tasa_descarte: typeof row.tasa_descarte === 'number' ? row.tasa_descarte : 0,
    tasa_aprobacion: typeof row.tasa_aprobacion === 'number' ? row.tasa_aprobacion : 0,
    tiempo_promedio_seg: row.tiempo_promedio_seg || 1.8
  };
};

/**
 * GET /api/dashboard/graficos
 * Genera datasets agregados en base de datos para renderizar con Chart.js:
 * 1. Pareto de defectos (distribución de fallas y % acumulado)
 * 2. Evolución temporal (tendencia por rangos horarios)
 * 3. Comparativa de efectividad por tipo de envase (FRASCO vs. LATA)
 * @param {object} filtros
 * @returns {Promise<object>}
 */
const obtenerGraficos = async (filtros = {}) => {
  const { whereClause, params } = buildWhereFilters(filtros);

  // 1. Diagrama de Pareto de Defectos (Frecuencia + % Acumulado 80/20)
  const paretoSql = `
    WITH conteo_defectos AS (
      SELECT 
        td.id,
        td.codigo,
        td.nombre,
        td.severidad,
        td.tipo_envase,
        COUNT(i.id)::int AS cantidad
      FROM tipos_defecto td
      JOIN inspecciones i ON i.tipo_defecto_id = td.id
      JOIN lotes l ON i.lote_id = l.id
      WHERE i.estado = 'RECHAZADO' ${whereClause}
      GROUP BY td.id, td.codigo, td.nombre, td.severidad, td.tipo_envase
    ),
    total_rechazos AS (
      SELECT COALESCE(SUM(cantidad), 0)::numeric AS gran_total FROM conteo_defectos
    )
    SELECT 
      cd.id,
      cd.codigo,
      cd.nombre,
      cd.severidad,
      cd.tipo_envase,
      cd.cantidad,
      ROUND(
        CASE 
          WHEN tr.gran_total > 0 THEN (cd.cantidad / tr.gran_total) * 100 
          ELSE 0 
        END, 2
      )::float AS porcentaje,
      ROUND(
        CASE 
          WHEN tr.gran_total > 0 THEN 
            (SUM(cd.cantidad) OVER (ORDER BY cd.cantidad DESC, cd.nombre ASC) / tr.gran_total) * 100 
          ELSE 0 
        END, 2
      )::float AS porcentaje_acumulado
    FROM conteo_defectos cd
    CROSS JOIN total_rechazos tr
    ORDER BY cd.cantidad DESC, cd.nombre ASC;
  `;

  // 2. Evolución Temporal (Agrupación por hora / intervalos temporales)
  const evolucionSql = `
    SELECT 
      TO_CHAR(DATE_TRUNC('hour', i.fecha_hora), 'YYYY-MM-DD HH24:00') AS periodo,
      COUNT(*)::int AS total,
      COUNT(CASE WHEN i.estado = 'APROBADO' THEN 1 END)::int AS aprobados,
      COUNT(CASE WHEN i.estado = 'RECHAZADO' THEN 1 END)::int AS rechazados,
      ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN i.estado = 'RECHAZADO' THEN 1 END)::numeric / COUNT(*)::numeric) * 100 
          ELSE 0 
        END, 2
      )::float AS tasa_rechazo
    FROM inspecciones i
    JOIN lotes l ON i.lote_id = l.id
    WHERE 1=1 ${whereClause}
    GROUP BY DATE_TRUNC('hour', i.fecha_hora)
    ORDER BY DATE_TRUNC('hour', i.fecha_hora) ASC;
  `;

  // 3. Comparativa de Efectividad por Tipo de Envase (FRASCO vs. LATA)
  // Nota: Para la comparativa, si se filtró por tipo_envase se respeta; de lo contrario se comparan ambos
  const comparativaSql = `
    SELECT 
      l.tipo_envase,
      COUNT(i.id)::int AS total_procesado,
      COUNT(CASE WHEN i.estado = 'APROBADO' THEN 1 END)::int AS aprobados,
      COUNT(CASE WHEN i.estado = 'RECHAZADO' THEN 1 END)::int AS rechazados,
      ROUND(
        CASE 
          WHEN COUNT(i.id) > 0 THEN (COUNT(CASE WHEN i.estado = 'RECHAZADO' THEN 1 END)::numeric / COUNT(i.id)::numeric) * 100 
          ELSE 0 
        END, 2
      )::float AS tasa_descarte_porcentaje,
      ROUND(
        CASE 
          WHEN COUNT(i.id) > 0 THEN (COUNT(CASE WHEN i.estado = 'APROBADO' THEN 1 END)::numeric / COUNT(i.id)::numeric) * 100 
          ELSE 0 
        END, 2
      )::float AS tasa_aprobacion_porcentaje
    FROM lotes l
    JOIN inspecciones i ON i.lote_id = l.id
    WHERE 1=1 ${whereClause}
    GROUP BY l.tipo_envase
    ORDER BY l.tipo_envase ASC;
  `;

  // Ejecución paralela de las 3 consultas analíticas en Neon Cloud
  const [paretoRes, evolucionRes, comparativaRes] = await Promise.all([
    query(paretoSql, params),
    query(evolucionSql, params),
    query(comparativaSql, params)
  ]);

  return {
    pareto_defectos: paretoRes.rows || [],
    evolucion_temporal: evolucionRes.rows || [],
    comparativa_envase: comparativaRes.rows || []
  };
};

module.exports = {
  obtenerKpis,
  obtenerGraficos
};
