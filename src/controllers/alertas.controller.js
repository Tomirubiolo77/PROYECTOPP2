// Los controladores sirven para manejar las peticiones http de los servicios y rutas.
// Aqui recibimos req, res, next y trabajamos con eso. Por ejemplo: si queremos listar las alertas, recibimos req con la peticion get y respondemos con res.
// res.status().json()  nos ayuda a enviar la respuesta al cliente.
// next(error) sirve para enviar el error a la capa de errores.

// Entonces controllers sirve para controlar las acciones de los servicios que tenemos, los middlewares se encargan de la autorizacion y validacion, y los servicios se encargan de la logica de negocio.
// Y las routes basicamente es donde va a entrar la peticion http y es lo que va a mostrar o enviar al front. Es como la entrada a los controladores, como un puente entre el cliente y el servidor.


/**
 * Controlador de Alertas de Calidad
 * Proyecto: NutriScan - Calidad 4.0
 */

const alertasService = require('../services/alertas.service');

/**
 * GET /api/alertas - Listar alertas con filtros  
 */

// Listamos lo obtenido en el servicio
// El servicio cuenta con consultas sql a la base de datos a traves del orm prisma
// Entonces controllers sirve para controlar las acciones de los servicios que tenemos, los middlewares se encargan de la autorizacion y validacion, y los servicios se encargan de la logica de negocio.
const listarAlertas = async (req, res, next) => {
  try {
    const { atendida, nivel, limit, offset } = req.query;
    const resultado = await alertasService.obtenerAlertas({
      atendida,
      nivel,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alertas/metricas - Métricas para widgets y gráficos
 */
const metricas = async (req, res, next) => {
  try {
    const resumen = await alertasService.obtenerMetricasAlertas();

    return res.status(200).json({
      success: true,
      data: resumen
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alertas/:id - Detalle de una alerta
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const alerta = await alertasService.obtenerPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/alertas/:id/atender - Marcar alerta como atendida (SUPERVISOR, ADMIN)
 */
const atenderAlerta = async (req, res, next) => {
  try {
    const alerta = await alertasService.atenderAlerta(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Alerta marcada como atendida exitosamente',
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/alertas/:id - Modificar alerta (Solo ADMIN)
 */
const actualizarAlerta = async (req, res, next) => {
  try {
    const { mensaje, nivel, atendida } = req.body;
    const alerta = await alertasService.actualizarAlerta(req.params.id, {
      mensaje,
      nivel,
      atendida
    });

    return res.status(200).json({
      success: true,
      message: 'Alerta actualizada exitosamente',
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarAlertas,
  metricas,
  obtenerPorId,
  atenderAlerta,
  actualizarAlerta
};
