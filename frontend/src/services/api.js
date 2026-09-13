/**
 * Cliente HTTP Modular y Centralizado para NutriScan API
 * Maneja inyección de Bearer Token, parseo de JSON, y captura global de errores HTTP (401, 403, 500)
 */

// Normalización robusta de la URL base para evitar errores comunes (barras al final o falta de /api)
const normalizeApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  url = url.trim().replace(/\/+$/, ''); // Quita barras al final
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = normalizeApiUrl();

/**
 * Función base para peticiones HTTP
 * @param {string} endpoint - Ruta relativa sin '/api' inicial si ya está en base
 * @param {object} options - Opciones de fetch (method, body, headers, etc.)
 */
export const request = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${API_BASE_URL}/${cleanEndpoint}`;

  // 1. Obtener token de autenticación de localStorage
  const token = localStorage.getItem('nutriscan_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Parsear respuesta si es JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    // 2. Manejo de Errores por Código de Estado HTTP
    if (!response.ok) {
      if (response.status === 401) {
        // Sesión expirada o token inválido: limpiar sesión
        localStorage.removeItem('nutriscan_token');
        localStorage.removeItem('nutriscan_user');
        window.dispatchEvent(new CustomEvent('nutriscan:unauthorized'));
      }

      const errorMessage = (data && data.error) || (data && data.message) || `Error HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Si es un error de red (backend caído, etc.)
    if (!err.status) {
      err.status = 0;
      err.message = 'No se pudo conectar con el servidor NutriScan API. Verifique que el backend esté activo.';
    }
    throw err;
  }
};

// ==========================================
// Servicios Específicos de Dominio
// ==========================================

export const authService = {
  login: async (email, password) => {
    return await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  perfil: async () => {
    return await request('/auth/perfil', {
      method: 'GET',
    });
  },
};

export const healthService = {
  check: async () => {
    return await request('/health', {
      method: 'GET',
    });
  },
};

export const lotesService = {
  getActivo: async (tipo_envase) => {
    const query = tipo_envase ? `?tipo_envase=${encodeURIComponent(tipo_envase)}` : '';
    return await request(`/lotes/activo${query}`, {
      method: 'GET',
    });
  },
  listar: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.tipo_envase) searchParams.append('tipo_envase', params.tipo_envase);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/lotes${qs}`, {
      method: 'GET',
    });
  },
  crear: async ({ codigo_lote, producto, tipo_envase }) => {
    return await request('/lotes', {
      method: 'POST',
      body: { codigo_lote, producto, tipo_envase },
    });
  },
  obtenerPorId: async (id) => {
    return await request(`/lotes/${id}`, {
      method: 'GET',
    });
  },
  finalizar: async (id) => {
    return await request(`/lotes/${id}/finalizar`, {
      method: 'PATCH',
    });
  },
};

export const inspeccionesService = {
  registrar: async ({ lote_id, tipo_defecto_id, estado, imagen_url, observacion }) => {
    return await request('/inspecciones', {
      method: 'POST',
      body: {
        lote_id,
        tipo_defecto_id: estado === 'RECHAZADO' ? tipo_defecto_id : null,
        estado,
        imagen_url: imagen_url || null,
        observacion: observacion || null,
      },
    });
  },
  historialPorLote: async (loteId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/inspecciones/lote/${loteId}${qs}`, {
      method: 'GET',
    });
  },
  listar: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.lote_id) searchParams.append('lote_id', params.lote_id);
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/inspecciones${qs}`, {
      method: 'GET',
    });
  },
};

export const tiposDefectoService = {
  listar: async (tipo_envase) => {
    const query = tipo_envase ? `?tipo_envase=${encodeURIComponent(tipo_envase)}` : '';
    return await request(`/tipos-defecto${query}`, {
      method: 'GET',
    });
  },
  obtenerPorId: async (id) => {
    return await request(`/tipos-defecto/${id}`, {
      method: 'GET',
    });
  },
  crear: async (datos) => {
    return await request('/tipos-defecto', {
      method: 'POST',
      body: datos,
    });
  },
  actualizar: async (id, datos) => {
    return await request(`/tipos-defecto/${id}`, {
      method: 'PUT',
      body: datos,
    });
  },
  eliminar: async (id) => {
    return await request(`/tipos-defecto/${id}`, {
      method: 'DELETE',
    });
  },
};

export const alertasService = {
  listar: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.atendida !== undefined) searchParams.append('atendida', params.atendida);
    if (params.nivel) searchParams.append('nivel', params.nivel);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await request(`/alertas${qs}`, {
      method: 'GET',
    });
  },
  metricas: async () => {
    return await request('/alertas/metricas', {
      method: 'GET',
    });
  },
  atender: async (id) => {
    return await request(`/alertas/${id}/atender`, {
      method: 'PATCH',
    });
  },
};
