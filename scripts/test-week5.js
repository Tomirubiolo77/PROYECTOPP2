/**
 * Script de Pruebas Automatizadas para Semana 05 — Integración Frontend / API
 * Proyecto: NutriScan - Calidad 4.0
 * Valida los contratos de datos y flujos consumidos por los componentes de React:
 *  1. Health Check (Neon Cloud y Servidor Express)
 *  2. Autenticación y Perfiles para Operario, Supervisor y Admin
 *  3. Ciclo de Estación del Operario: Lote activo, Inspección Conforme y Rechazo con Defecto
 *  4. Métricas reactivas y recuento de descartes (/api/inspecciones/lote/:id)
 *  5. Dashboard de Supervisión: Bandeja de Alertas, Métricas (/api/alertas/metricas), Atención y Cierre
 *  6. Configuración de Admin: CRUD completo de Catálogo de Defectos
 */

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const PORT = 3003; // Puerto aislado para tests de S5

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
        headers: requestHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
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

const runWeek5Tests = async () => {
  console.log('================================================================');
  console.log('🚀 INICIANDO SUITE DE PRUEBAS DE INTEGRACIÓN — SEMANA 05');
  console.log('   NutriScan: Frontend React SPA Contracts & Endpoints');
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // 1. Health Check (Badge del Navbar y Diagnóstico Admin)
    // -------------------------------------------------------------
    console.log('🌐 BLOQUE 1: Health Check (Navbar Badge & Diagnóstico Admin)');
    const healthRes = await request({ method: 'GET', path: '/api/health' });
    assert(healthRes.statusCode === 200, 'GET /api/health responde 200 OK');
    assert(healthRes.body.database.connected === true, 'PostgreSQL en Neon Cloud está ONLINE');
    assert(healthRes.body.status === 'HEALTHY', 'Estado del sistema es HEALTHY');

    // -------------------------------------------------------------
    // 2. Autenticación y Perfiles para Chips de Demostración
    // -------------------------------------------------------------
    console.log('\n🔑 BLOQUE 2: Autenticación de Usuarios de Demostración (Chips)');
    
    // Login Operario
    const opLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });
    assert(opLogin.statusCode === 200, 'Login de Operario exitoso');
    assert(opLogin.body.data.usuario.rol === 'OPERARIO', 'Rol confirmado: OPERARIO');
    const opToken = opLogin.body.data.token;

    // Login Supervisor
    const supLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'supervisor@nutriscan.com', password: '123456' }
    });
    assert(supLogin.statusCode === 200, 'Login de Supervisor exitoso');
    assert(supLogin.body.data.usuario.rol === 'SUPERVISOR', 'Rol confirmado: SUPERVISOR');
    const supToken = supLogin.body.data.token;

    // Login Admin
    const adminLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@nutriscan.com', password: '123456' }
    });
    assert(adminLogin.statusCode === 200, 'Login de Admin exitoso');
    assert(adminLogin.body.data.usuario.rol === 'ADMIN', 'Rol confirmado: ADMIN');
    const adminToken = adminLogin.body.data.token;

    // Perfil con Bearer
    const perfilRes = await request({
      method: 'GET',
      path: '/api/auth/perfil',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(perfilRes.statusCode === 200, 'GET /api/auth/perfil valida sesión con token Bearer');
    assert(perfilRes.body.data.email === 'operario@nutriscan.com', 'Datos de perfil coinciden');

    // -------------------------------------------------------------
    // 3. Flujo del Panel de Operario (/operario/estacion)
    // -------------------------------------------------------------
    console.log('\n🏭 BLOQUE 3: Panel de Operario (Lote Activo, Inspección y Métricas)');

    // Supervisor crea un lote activo para la prueba de línea FRASCO
    const codLoteTest = `LOTE-S5-${Date.now().toString().slice(-4)}`;
    const nuevoLoteRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${supToken}` },
      body: {
        codigo_lote: codLoteTest,
        producto: 'Mermelada de Frambuesa 500g',
        tipo_envase: 'FRASCO'
      }
    });
    assert(nuevoLoteRes.statusCode === 201, `Apertura de lote '${codLoteTest}'`);
    const loteId = nuevoLoteRes.body.data.id;

    // Operario consulta lote activo en línea FRASCO
    const loteActivoRes = await request({
      method: 'GET',
      path: '/api/lotes/activo?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(loteActivoRes.statusCode === 200, 'Operario obtiene lote activo para FRASCO');
    assert(loteActivoRes.body.data.codigo_lote === codLoteTest, 'Código de lote activo coincide');

    // Operario consulta catálogo dinámico de defectos para FRASCO
    const defectosRes = await request({
      method: 'GET',
      path: '/api/tipos-defecto?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(defectosRes.statusCode === 200, 'Operario carga catálogo dinámico de defectos');
    assert(Array.isArray(defectosRes.body.data), 'Catálogo es una lista de defectos');
    assert(defectosRes.body.data.length > 0, 'Hay al menos un defecto disponible para FRASCO');
    const defectoParaRechazo = defectosRes.body.data[0];

    // Operario registra pieza conforme
    const conformeRes = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Pieza conforme verificada por sensor AVZ-02'
      }
    });
    assert(conformeRes.statusCode === 201, 'Inspección conforme registrada exitosamente');

    // Operario registra pieza con defecto (RECHAZADO)
    const rechazoRes = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoParaRechazo.id,
        estado: 'RECHAZADO',
        observacion: 'Tapa torcida detectada visualmente'
      }
    });
    assert(rechazoRes.statusCode === 201, 'Inspección rechazada registrada exitosamente');
    assert(rechazoRes.body.data.alertas && rechazoRes.body.data.alertas.length > 0, 'Alerta automática generada para el supervisor');
    const alertaGeneradaId = rechazoRes.body.data.alertas[0].id;

    // Operario consulta recuento de descartes e indicadores en tiempo real
    const metricasLoteRes = await request({
      method: 'GET',
      path: `/api/inspecciones/lote/${loteId}`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(metricasLoteRes.statusCode === 200, 'GET /api/inspecciones/lote/:id responde 200 OK');
    const { resumen_estadistico } = metricasLoteRes.body.data;
    assert(resumen_estadistico.total_unidades === 2, 'Contador total de unidades: 2');
    assert(resumen_estadistico.unidades_aprobadas === 1, 'Contador de unidades conformes: 1');
    assert(resumen_estadistico.unidades_rechazadas === 1, 'Contador de descartes: 1');
    assert(resumen_estadistico.tasa_defecto_porcentaje === 50, 'Tasa de descarte: 50%');

    // -------------------------------------------------------------
    // 4. Flujo del Dashboard de Supervisión (/supervisor/dashboard)
    // -------------------------------------------------------------
    console.log('\n📊 BLOQUE 4: Dashboard de Supervisión (Alertas y Auditoría)');

    // Métricas de alertas para tarjetas KPI
    const metricasAlertasRes = await request({
      method: 'GET',
      path: '/api/alertas/metricas',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(metricasAlertasRes.statusCode === 200, 'Supervisor consulta métricas de alertas');
    assert(metricasAlertasRes.body.data.alertas_pendientes >= 1, 'KPI registra alertas pendientes');

    // Supervisor atiende la alerta generada
    const atenderRes = await request({
      method: 'PATCH',
      path: `/api/alertas/${alertaGeneradaId}/atender`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(atenderRes.statusCode === 200, `Supervisor atiende alerta #${alertaGeneradaId}`);
    assert(atenderRes.body.data.atendida === true, 'Estado de la alerta actualizado a atendida: true');

    // Supervisor consulta tabla de auditoría con filtros
    const auditoriaRes = await request({
      method: 'GET',
      path: `/api/inspecciones?lote_id=${loteId}&estado=RECHAZADO`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(auditoriaRes.statusCode === 200, 'Supervisor consulta auditoría filtrada');
    const listaInspecciones = auditoriaRes.body.inspecciones || auditoriaRes.body.data || [];
    assert(listaInspecciones.length === 1, 'Filtro retorna exactamente 1 rechazo para el lote');

    // Supervisor finaliza el lote
    const finLoteRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(finLoteRes.statusCode === 200, 'Supervisor finaliza lote exitosamente');
    assert(finLoteRes.body.data.estado === 'FINALIZADO', 'Estado del lote ahora es FINALIZADO');

    // -------------------------------------------------------------
    // 5. Flujo de Configuración de Admin (/admin/configuracion)
    // -------------------------------------------------------------
    console.log('\n🛠️ BLOQUE 5: Configuración de Admin (CRUD de Tipos de Defecto)');

    // Crear nuevo defecto
    const codigoDefectoTest = `DEF-S5-${Date.now().toString().slice(-3)}`;
    const crearDefRes = await request({
      method: 'POST',
      path: '/api/tipos-defecto',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        codigo: codigoDefectoTest,
        nombre: 'Fisura Micrométrica en Base',
        tipo_envase: 'FRASCO',
        severidad: 'CRITICA',
        descripcion: 'Defecto estructural crítico para test S5'
      }
    });
    assert(crearDefRes.statusCode === 201, `Admin crea defecto '${codigoDefectoTest}'`);
    const nuevoDefId = crearDefRes.body.data.id;

    // Actualizar defecto
    const updateDefRes = await request({
      method: 'PUT',
      path: `/api/tipos-defecto/${nuevoDefId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        codigo: codigoDefectoTest,
        nombre: 'Fisura Micrométrica en Base (Modificada)',
        tipo_envase: 'FRASCO',
        severidad: 'MEDIA',
        descripcion: 'Severidad reducida a media'
      }
    });
    assert(updateDefRes.statusCode === 200, 'Admin actualiza defecto exitosamente');
    assert(updateDefRes.body.data.severidad === 'MEDIA', 'Severidad actualizada confirmada');

    // Eliminar defecto
    const deleteDefRes = await request({
      method: 'DELETE',
      path: `/api/tipos-defecto/${nuevoDefId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteDefRes.statusCode === 200, 'Admin elimina defecto no referenciado');

    console.log('\n================================================================');
    console.log('🏆 TODAS LAS PRUEBAS DE INTEGRACIÓN DE LA SEMANA 05 PASARON (100%)');
    console.log('   - Health Check & Conectividad Neon: OK');
    console.log('   - AuthContext & Credenciales de Demostración: OK');
    console.log('   - Estación de Operario & Contadores en Vivo: OK');
    console.log('   - Dashboard de Supervisión & Atención de Alertas: OK');
    console.log('   - Configuración Maestra & CRUD de Catálogo: OK');
    console.log('================================================================');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DE PRUEBAS DE SEMANA 05:', error);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
};

runWeek5Tests();
