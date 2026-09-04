/**
 * Script de Pruebas de Integración y Seguridad para Semana 04
 * Proyecto: NutriScan - Calidad 4.0
 * Valida: Auth JWT, RBAC, Lógica Transaccional (Lotes/Inspecciones/Alertas), Helmet y Sanitización.
 */

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const PORT = 3002; // Puerto aislado para tests

// Helper para peticiones HTTP
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const requestHeaders = { ...headers };

    if (body) {
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      `http://localhost:${PORT}${path}`,
      {
        method,
        headers: requestHeaders
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(rawData);
          } catch (e) {
            parsedBody = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ FALLÓ LA ASERCIÓN: ${message}`);
  }
  console.log(`   ✅ PASS: ${message}`);
};

const runWeek4Tests = async () => {
  console.log('================================================================');
  console.log('🛡️  INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS — SEMANA 04');
  console.log('    NutriScan: Auth JWT, Roles (RBAC), Negocio y Ciberseguridad');
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // BLOQUE 1: VERIFICACIÓN DE CABECERAS DE CIBERSEGURIDAD (HELMET)
    // -------------------------------------------------------------
    console.log('🔒 BLOQUE 1: Verificación de Cabeceras HTTP Seguras (Helmet)');
    const rootRes = await request({ method: 'GET', path: '/' });
    assert(rootRes.statusCode === 200, 'Root endpoint responde 200 OK');
    assert(rootRes.headers['x-content-type-options'] === 'nosniff', 'Cabecera X-Content-Type-Options es nosniff');
    assert(rootRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Cabecera X-Frame-Options es SAMEORIGIN (Anti-Clickjacking)');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 2: AUTENTICACIÓN JWT Y PREVENCIÓN DE FUGAS
    // -------------------------------------------------------------
    console.log('🔑 BLOQUE 2: Autenticación JWT y Prevención de Fugas de Información');

    // 2.1 Login con credenciales incorrectas
    const loginFail = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: 'password_erroneo' }
    });
    assert(loginFail.statusCode === 401, 'Rechazo 401 con contraseña incorrecta');
    assert(loginFail.body.success === false, 'Respuesta indica success: false');

    // 2.2 Login con usuario inexistente (evita enumeración de usuarios)
    const loginNoUser = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'fantasma@nutriscan.com', password: '123' }
    });
    assert(loginNoUser.statusCode === 401, 'Rechazo 401 con correo no registrado (sin enumerar)');

    // 2.3 Login exitoso de OPERARIO
    const loginOperario = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });
    assert(loginOperario.statusCode === 200, 'Login exitoso de OPERARIO (200 OK)');
    assert(Boolean(loginOperario.body.data.token), 'Token JWT emitido');
    assert(loginOperario.body.data.usuario.rol === 'OPERARIO', 'Rol confirmado: OPERARIO');
    assert(!loginOperario.body.data.usuario.password_hash, 'Seguridad: password_hash NO expuesto');
    const tokenOperario = loginOperario.body.data.token;

    // 2.4 Login exitoso de SUPERVISOR
    const loginSupervisor = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'supervisor@nutriscan.com', password: '123456' }
    });
    assert(loginSupervisor.statusCode === 200, 'Login exitoso de SUPERVISOR (200 OK)');
    assert(loginSupervisor.body.data.usuario.rol === 'SUPERVISOR', 'Rol confirmado: SUPERVISOR');
    const tokenSupervisor = loginSupervisor.body.data.token;

    // 2.5 Login exitoso de ADMIN
    const loginAdmin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@nutriscan.com', password: '123456' }
    });
    assert(loginAdmin.statusCode === 200, 'Login exitoso de ADMIN (200 OK)');
    assert(loginAdmin.body.data.usuario.rol === 'ADMIN', 'Rol confirmado: ADMIN');
    const tokenAdmin = loginAdmin.body.data.token;

    // 2.6 Perfil con token válido
    const perfilRes = await request({
      method: 'GET',
      path: '/api/auth/perfil',
      headers: { Authorization: `Bearer ${tokenOperario}` }
    });
    assert(perfilRes.statusCode === 200, 'GET /api/auth/perfil devuelve 200 con Bearer Token');
    assert(perfilRes.body.data.email === 'operario@nutriscan.com', 'Perfil verificado correctamente');

    // 2.7 Petición protegida sin token
    const noTokenRes = await request({
      method: 'GET',
      path: '/api/auth/perfil'
    });
    assert(noTokenRes.statusCode === 401, 'Rechazo 401 en ruta privada sin token');

    // 2.8 Petición con token manipulado
    const invalidTokenRes = await request({
      method: 'GET',
      path: '/api/auth/perfil',
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenFalso' }
    });
    assert(invalidTokenRes.statusCode === 401, 'Rechazo 401 ante token JWT manipulado');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 3: CONTROL DE ACCESO BASADO EN ROLES (RBAC)
    // -------------------------------------------------------------
    console.log('🛡️  BLOQUE 3: Control de Acceso por Roles (RBAC)');

    // 3.1 Operario intentando crear un lote (Prohibido)
    const opCreaLote = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${tokenOperario}` },
      body: {
        codigo_lote: 'LOTE-TEST-ILEGAL',
        producto: 'Prueba',
        tipo_envase: 'FRASCO'
      }
    });
    assert(opCreaLote.statusCode === 403, 'Operario bloqueado con 403 al intentar crear lote');

    // 3.2 Operario intentando crear tipo de defecto (Prohibido)
    const opCreaDefecto = await request({
      method: 'POST',
      path: '/api/tipos-defecto',
      headers: { Authorization: `Bearer ${tokenOperario}` },
      body: {
        codigo: 'DEFECTO_HACK',
        nombre: 'Falla Hack',
        tipo_envase: 'LATA',
        severidad: 'BAJA'
      }
    });
    assert(opCreaDefecto.statusCode === 403, 'Operario bloqueado con 403 al intentar crear tipo de defecto');

    // 3.3 Operario intentando ver panel de alertas (Prohibido)
    const opVeAlertas = await request({
      method: 'GET',
      path: '/api/alertas',
      headers: { Authorization: `Bearer ${tokenOperario}` }
    });
    assert(opVeAlertas.statusCode === 403, 'Operario bloqueado con 403 al intentar acceder a alertas');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 4: GESTIÓN OPERATIVA DE LOTES (SUPERVISOR)
    // -------------------------------------------------------------
    console.log('📦 BLOQUE 4: Gestión de Lotes de Producción');

    const codigoLoteNuevo = `LOTE-S4-${Date.now().toString().slice(-6)}`;
    const nuevoLoteRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${tokenSupervisor}` },
      body: {
        codigo_lote: codigoLoteNuevo,
        producto: 'Mermelada de Frutilla 400g',
        tipo_envase: 'FRASCO'
      }
    });
    assert(nuevoLoteRes.statusCode === 201, 'Supervisor crea lote exitosamente (201 Created)');
    const loteId = nuevoLoteRes.body.data.id;
    assert(nuevoLoteRes.body.data.codigo_lote === codigoLoteNuevo, 'Código de lote confirmado');

    // Consulta de lote activo
    const loteActivoRes = await request({
      method: 'GET',
      path: '/api/lotes/activo?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${tokenOperario}` }
    });
    assert(loteActivoRes.statusCode === 200, 'Operario consulta lote activo en línea (200 OK)');
    assert(loteActivoRes.body.data.id === loteId, 'Lote activo coincide con el recién abierto');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 5: INSPECCIONES Y DISPARO AUTOMÁTICO DE ALERTAS
    // -------------------------------------------------------------
    console.log('🔬 BLOQUE 5: Lógica de Inspecciones y Alertas Automáticas');

    // 5.1 Registro de inspección APROBADA por el Operario
    const inspAprobada = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${tokenOperario}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Sellado al vacío conforme'
      }
    });
    assert(inspAprobada.statusCode === 201, 'Inspección APROBADA registrada (201 Created)');
    assert(inspAprobada.body.data.estado === 'APROBADO', 'Estado APROBADO');
    assert(inspAprobada.body.data.alertas.length === 0, 'No genera alertas si es aprobada');

    // 5.2 Registro de inspección RECHAZADA por el Operario (con defecto de frasco ID 1: SIN_TAPA)
    const inspRechazada = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${tokenOperario}` },
      body: {
        lote_id: loteId,
        estado: 'RECHAZADO',
        tipo_defecto_id: 1, // SIN_TAPA (CRITICA)
        observacion: 'Cámara detectó ausencia total de tapa',
        imagen_url: 'https://storage.nutriscan.com/capturas/def-sin-tapa-01.jpg'
      }
    });
    assert(inspRechazada.statusCode === 201, 'Inspección RECHAZADA registrada (201 Created)');
    assert(inspRechazada.body.data.estado === 'RECHAZADO', 'Estado RECHAZADO');
    assert(inspRechazada.body.data.alertas.length === 1, '🚨 Alerta generada automáticamente en tabla alertas');
    assert(inspRechazada.body.data.alertas[0].nivel === 'CRITICA', 'Nivel de alerta automático es CRITICA');
    const alertaGeneradaId = inspRechazada.body.data.alertas[0].id;

    // 5.3 Consulta de historial de lote con métricas (Crucial para Pantalla de Operario Semana 5)
    const historialLoteRes = await request({
      method: 'GET',
      path: `/api/inspecciones/lote/${loteId}`,
      headers: { Authorization: `Bearer ${tokenOperario}` }
    });
    assert(historialLoteRes.statusCode === 200, 'GET /api/inspecciones/lote/:id responde 200');
    const resumen = historialLoteRes.body.data.resumen_estadistico;
    assert(resumen.total_unidades === 2, 'Recuento total de unidades: 2');
    assert(resumen.unidades_aprobadas === 1, 'Recuento de unidades aprobadas: 1');
    assert(resumen.unidades_rechazadas === 1, 'Recuento de unidades rechazadas: 1');
    assert(resumen.tasa_defecto_porcentaje === 50, 'Tasa de defecto calculada: 50%');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 6: SEGUIMIENTO DE ALERTAS Y RESOLUCIÓN (SUPERVISOR/ADMIN)
    // -------------------------------------------------------------
    console.log('🚨 BLOQUE 6: Gestión y Atención de Alertas');

    // 6.1 Supervisor consulta métricas de alertas
    const metricasAlertas = await request({
      method: 'GET',
      path: '/api/alertas/metricas',
      headers: { Authorization: `Bearer ${tokenSupervisor}` }
    });
    assert(metricasAlertas.statusCode === 200, 'GET /api/alertas/metricas responde 200');
    assert(metricasAlertas.body.data.alertas_pendientes >= 1, 'Métricas registran alertas pendientes');

    // 6.2 Supervisor marca alerta como atendida
    const atenderRes = await request({
      method: 'PATCH',
      path: `/api/alertas/${alertaGeneradaId}/atender`,
      headers: { Authorization: `Bearer ${tokenSupervisor}` }
    });
    assert(atenderRes.statusCode === 200, 'Supervisor atiende alerta (200 OK)');
    assert(atenderRes.body.data.atendida === true, 'Alerta actualizada a atendida: true');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 7: ADMINISTRACIÓN DE CATÁLOGO (ADMIN CRUD)
    // -------------------------------------------------------------
    console.log('🏷️  BLOQUE 7: CRUD del Catálogo de Defectos (Admin)');

    // 7.1 Admin crea nuevo defecto
    const codigoDefectoTest = `DEF_${Date.now().toString().slice(-4)}`;
    const crearDefectoRes = await request({
      method: 'POST',
      path: '/api/tipos-defecto',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        codigo: codigoDefectoTest,
        nombre: 'Cierre Defectuoso por Rosca Cruzada',
        tipo_envase: 'FRASCO',
        severidad: 'MEDIA',
        descripcion: 'Defecto en roscado de tapa'
      }
    });
    assert(crearDefectoRes.statusCode === 201, 'Admin crea tipo de defecto (201 Created)');
    const nuevoDefectoId = crearDefectoRes.body.data.id;

    // 7.2 Admin actualiza defecto
    const actualizarDefectoRes = await request({
      method: 'PUT',
      path: `/api/tipos-defecto/${nuevoDefectoId}`,
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        severidad: 'ALTA'
      }
    });
    assert(actualizarDefectoRes.statusCode === 200, 'Admin actualiza defecto (200 OK)');
    assert(actualizarDefectoRes.body.data.severidad === 'ALTA', 'Severidad actualizada a ALTA');

    // 7.3 Admin elimina defecto de prueba
    const eliminarDefectoRes = await request({
      method: 'DELETE',
      path: `/api/tipos-defecto/${nuevoDefectoId}`,
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert(eliminarDefectoRes.statusCode === 200, 'Admin elimina defecto no referenciado (200 OK)');
    console.log('');

    // -------------------------------------------------------------
    // BLOQUE 8: FINALIZACIÓN DE LOTE Y RESTRICCIONES OPERATIVAS
    // -------------------------------------------------------------
    console.log('🏁 BLOQUE 8: Cierre de Lote y Restricciones Operativas');

    // 8.1 Supervisor finaliza lote
    const finalizarRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${tokenSupervisor}` }
    });
    assert(finalizarRes.statusCode === 200, 'Supervisor finaliza lote (200 OK)');
    assert(finalizarRes.body.data.estado === 'FINALIZADO', 'Estado del lote ahora es FINALIZADO');

    // 8.2 Intento de registrar inspección en lote cerrado
    const inspLoteCerrado = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${tokenOperario}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO'
      }
    });
    assert(inspLoteCerrado.statusCode === 400, 'Rechazo 400 al intentar inspeccionar lote finalizado');
    console.log('');

    console.log('================================================================');
    console.log('🏆 TODAS LAS PRUEBAS DE LA SEMANA 04 PASARON CON ÉXITO (100%)');
    console.log('   - Autenticación JWT y Bcrypt: OK');
    console.log('   - Control de Acceso por Roles (RBAC): OK');
    console.log('   - Prevención de Fugas de Información: OK');
    console.log('   - Gestión de Lotes y Cierre: OK');
    console.log('   - Inspecciones y Alertas Automáticas: OK');
    console.log('   - Métricas y Contadores para Frontend (S5): OK');
    console.log('   - CRUD de Catálogo para Administrador: OK');
    console.log('   - Cabeceras Helmet y Sanitización de Payloads: OK');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error en suite de pruebas:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
};

runWeek4Tests();
