/**
 * Controlador de Métricas y Analítica del Dashboard
 * Proyecto: NutriScan - Calidad 4.0 (Semana 08)
 */

const dashboardService = require('../services/dashboard.service');

/**
 * GET /api/dashboard/kpis - Obtener indicadores clave de desempeño (KPIs)
 */
const getKpis = async (req, res, next) => {
  try {
    const { lote_id, tipo_envase, fecha_desde, fecha_hasta } = req.query;
    const data = await dashboardService.obtenerKpis({
      lote_id,
      tipo_envase,
      fecha_desde,
      fecha_hasta
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/graficos - Obtener datos estructurados para Chart.js
 * (Pareto de defectos, Evolución temporal, Comparativa de envases)
 */
const getGraficos = async (req, res, next) => {
  try {
    const { lote_id, tipo_envase, fecha_desde, fecha_hasta } = req.query;
    const data = await dashboardService.obtenerGraficos({
      lote_id,
      tipo_envase,
      fecha_desde,
      fecha_hasta
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKpis,
  getGraficos
};
