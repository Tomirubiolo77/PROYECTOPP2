/**
 * Script de Validación E2E Automatizada — Semana 06: Integración Fullstack
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 * 
 * Circuito Completo End-to-End:
 *  1. Autenticación y RBAC (Supervisor, Operario, Admin)
 *  2. Apertura de Lote de Producción FRASCO (POST /api/lotes)
 *  3. Estación de Línea: Detección automática de Lote Activo (GET /api/lotes/activo?tipo_envase=FRASCO)
 *  4. Disparo de Pieza Conforme y Actualización Reactiva de Contadores
 *  5. Catálogo en Vivo y Disparo de Falla de Calidad (POST /api/inspecciones con RECHAZADO)
 *  6. Disparo Atómico de Alertas en Tabla 'alertas' (Neon Cloud)
 *  7. Supervisión: KPIs de Alertas y Atención en Vivo (PATCH /api/alertas/:id/atender)
 *  8. Cierre de Turno y Control de Integridad: Inspección en Lote Finalizado rechazada con 400 Bad Request
 *  9. Auditoría Histórica con Filtros Combinados (Lote y Resultado)
 * 10. Verificación de Sincronización y Variables de Entorno
 */

'use strict';

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const PORT = 3006; // Puerto exclusivo y aislado para la suite S6

const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = { ...headers };

    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      `http://localhost:${PORT}${path}`,
      { method, headers: reqHeaders },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

let passCount = 0;
let failCount = 0;

const assert = (condition, message) => {
  if (!condition) {
    failCount++;
    console.error(`   ❌ FALLÓ: ${message}`);
    throw new Error(`Aserción fallida: ${message}`);
  }
  passCount++;
  console.log(`   ✅ PASS: ${message}`);
};

const runWeek6E2ETests = async () => {
  console.log('\n================================================================');
  console.log('🚀 SUITE DE VALIDACIÓN INTEGRAL E2E — SEMANA 06');
  console.log('   NutriScan: Circuito Operativo Completo (Frontend ↔ API ↔ BD)');
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // BLOQUE 1: Health Check e Infraestructura Neon Cloud
    // -------------------------------------------------------------
    console.log('🌐 BLOQUE 1: Verificación de Conectividad e Infraestructura');
    const health = await request({ method: 'GET', path: '/api/health' });
    assert(health.statusCode === 200, 'GET /api/health responde 200 OK');
    assert(health.body.database?.connected === true, 'PostgreSQL en Neon Cloud está ONLINE');
    assert(health.body.status === 'HEALTHY', 'Estado del sistema reporta HEALTHY');

    // -------------------------------------------------------------
    // BLOQUE 2: Autenticación, Tokens JWT y Roles (RBAC)
    // -------------------------------------------------------------
    console.log('\n🔑 BLOQUE 2: Autenticación de Usuarios y Control RBAC');

    // Login Supervisor (Chip Rápido)
    const supLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'supervisor@nutriscan.com', password: '123456' }
    });
    assert(supLogin.statusCode === 200, 'Login Supervisor responde 200 OK');
    assert(supLogin.body.data?.usuario?.rol === 'SUPERVISOR', 'Rol validado: SUPERVISOR');
    const supToken = supLogin.body.data.token;

    // Login Operario (Chip Rápido)
    const opLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });
    assert(opLogin.statusCode === 200, 'Login Operario responde 200 OK');
    assert(opLogin.body.data?.usuario?.rol === 'OPERARIO', 'Rol validado: OPERARIO');
    const opToken = opLogin.body.data.token;

    // Login Administrador
    const adminLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@nutriscan.com', password: '123456' }
    });
    assert(adminLogin.statusCode === 200, 'Login Administrador responde 200 OK');
    assert(adminLogin.body.data?.usuario?.rol === 'ADMIN', 'Rol validado: ADMIN');
    const adminToken = adminLogin.body.data.token;

    // Control de Acceso: Operario no puede crear lotes (403 Forbidden)
    const rbacDeny = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${opToken}` },
      body: { codigo_lote: 'LOTE-RBAC-RECHAZO', producto: 'Prueba', tipo_envase: 'FRASCO' }
    });
    assert(rbacDeny.statusCode === 403, 'RBAC: Operario denegado (403) para POST /api/lotes');

    // Sin token: 401 Unauthorized
    const unauthReq = await request({ method: 'GET', path: '/api/alertas' });
    assert(unauthReq.statusCode === 401, 'Petición sin token rechazada con 401 Unauthorized');

    // -------------------------------------------------------------
    // BLOQUE 3: Gestión de Lote de Producción (Supervisor)
    // -------------------------------------------------------------
    console.log('\n🏭 BLOQUE 3: Apertura de Lote de Producción FRASCO');
    const codigoLote = `LOTE-S6-${Date.now().toString().slice(-5)}`;
    const crearLoteRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${supToken}` },
      body: {
        codigo_lote: codigoLote,
        producto: 'Mermelada de Frambuesa NutriScan 450g',
        tipo_envase: 'FRASCO'
      }
    });
    assert(crearLoteRes.statusCode === 201, `Lote '${codigoLote}' creado con 201 Created`);
    assert(crearLoteRes.body.data?.estado === 'EN_PROCESO', 'Lote inicia en estado EN_PROCESO');
    assert(crearLoteRes.body.data?.tipo_envase === 'FRASCO', 'Tipo de envase asignado: FRASCO');
    const loteId = crearLoteRes.body.data.id;
    console.log(`   🔖 ID de lote persistido en Neon Cloud: ${loteId}`);

    // Validación de unicidad de código (409 Conflict)
    const dupRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${supToken}` },
      body: { codigo_lote: codigoLote, producto: 'Duplicado', tipo_envase: 'FRASCO' }
    });
    assert(dupRes.statusCode === 409, 'Rechazo por código de lote duplicado (409 Conflict)');

    // -------------------------------------------------------------
    // BLOQUE 4: Operación en Estación de Línea (Operario)
    // -------------------------------------------------------------
    console.log('\n🔬 BLOQUE 4: Estación de Operario — Detección Automática de Lote');
    const loteActivoRes = await request({
      method: 'GET',
      path: '/api/lotes/activo?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(loteActivoRes.statusCode === 200, 'GET /api/lotes/activo?tipo_envase=FRASCO responde 200 OK');
    assert(loteActivoRes.body.data?.id === loteId, 'La estación detecta automáticamente el lote activo creado');
    assert(loteActivoRes.body.data?.codigo_lote === codigoLote, 'Código de lote verificado por el operario');

    // -------------------------------------------------------------
    // BLOQUE 5: Disparo de Pieza Conforme y Actualización Reactiva
    // -------------------------------------------------------------
    console.log('\n✅ BLOQUE 5: Registro de Pieza Conforme y Métricas Iniciales');
    const conformeRes = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Envase frasco con cierre hermético y etiqueta centrada (Sensor AVZ-02)'
      }
    });
    assert(conformeRes.statusCode === 201, 'Inspección conforme registrada exitosamente (201 Created)');
    assert(conformeRes.body.data?.estado === 'APROBADO', 'Estado verificado: APROBADO');
    assert(conformeRes.body.data?.alertas?.length === 0, 'Pieza conforme no genera alertas');

    // Verificación de contadores reactivos (1 pieza, 0 descartes, 0% rechazo)
    const metricas1Res = await request({
      method: 'GET',
      path: `/api/inspecciones/lote/${loteId}`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(metricas1Res.statusCode === 200, 'GET /api/inspecciones/lote/:id responde 200 OK');
    const stats1 = metricas1Res.body.data?.resumen_estadistico;
    assert(stats1.total_unidades === 1, 'Total de unidades inspeccionadas: 1');
    assert(stats1.unidades_aprobadas === 1, 'Unidades conformes: 1');
    assert(stats1.unidades_rechazadas === 0, 'Unidades rechazadas: 0');
    assert(stats1.tasa_defecto_porcentaje === 0, 'Tasa de descarte: 0.00%');

    // -------------------------------------------------------------
    // BLOQUE 6: Catálogo en Vivo y Disparo de Falla con Alerta Atómica
    // -------------------------------------------------------------
    console.log('\n🚨 BLOQUE 6: Catálogo en Vivo y Falla con Disparo Atómico de Alertas');
    
    // Obtener catálogo para FRASCO
    const catalogoRes = await request({
      method: 'GET',
      path: '/api/tipos-defecto?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(catalogoRes.statusCode === 200, 'Catálogo de defectos obtenido en vivo');
    assert(Array.isArray(catalogoRes.body.data) && catalogoRes.body.data.length > 0, 'Catálogo contiene defectos para FRASCO');
    const defectoTest = catalogoRes.body.data[0];
    console.log(`   🏷️  Defecto seleccionado: [${defectoTest.codigo}] ${defectoTest.nombre} (${defectoTest.severidad})`);

    // Disparo de pieza rechazada
    const rechazoRes = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoTest.id,
        estado: 'RECHAZADO',
        observacion: `Falla detectada por cámara AVZ-02: ${defectoTest.nombre}`
      }
    });
    assert(rechazoRes.statusCode === 201, 'Inspección rechazada registrada exitosamente (201 Created)');
    assert(rechazoRes.body.data?.estado === 'RECHAZADO', 'Estado verificado: RECHAZADO');
    assert(rechazoRes.body.data?.alertas && rechazoRes.body.data.alertas.length > 0, 'Alerta operativa disparada atómicamente');
    const alertaGenerada = rechazoRes.body.data.alertas[0];
    const alertaId = alertaGenerada.id;
    console.log(`   🔔 Alerta generada con ID: ${alertaId} (Nivel: ${alertaGenerada.nivel})`);

    // Comprobar actualización reactiva del contador y tasa de descarte (1 conforme, 1 rechazo = 50%)
    const metricas2Res = await request({
      method: 'GET',
      path: `/api/inspecciones/lote/${loteId}`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    const stats2 = metricas2Res.body.data?.resumen_estadistico;
    assert(stats2.total_unidades === 2, 'Total de unidades actualizadas: 2');
    assert(stats2.unidades_rechazadas === 1, 'Total de descartes registrados: 1');
    assert(stats2.tasa_defecto_porcentaje === 50, 'Tasa de descarte se recalculó al 50.00%');

    // -------------------------------------------------------------
    // BLOQUE 7: Supervisión y Atención Operativa de Alerta
    // -------------------------------------------------------------
    console.log('\n📊 BLOQUE 7: Panel de Supervisión y Atención de Alertas');
    
    // KPI de Alertas Pendientes
    const metricasAlertasRes = await request({
      method: 'GET',
      path: '/api/alertas/metricas',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(metricasAlertasRes.statusCode === 200, 'GET /api/alertas/metricas responde 200 OK');
    assert(metricasAlertasRes.body.data?.alertas_pendientes >= 1, 'KPI refleja al menos una alerta pendiente');

    // Verificar presencia en la Bandeja de Alertas no atendidas
    const bandejaRes = await request({
      method: 'GET',
      path: '/api/alertas?atendida=false',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    const listaPendientes = bandejaRes.body.alertas || bandejaRes.body.data || [];
    assert(listaPendientes.some(a => a.id === alertaId), `Alerta #${alertaId} visible en la bandeja del supervisor`);

    // Supervisor atiende la alerta en vivo (PATCH /api/alertas/:id/atender)
    const atenderRes = await request({
      method: 'PATCH',
      path: `/api/alertas/${alertaId}/atender`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(atenderRes.statusCode === 200, `PATCH /api/alertas/${alertaId}/atender responde 200 OK`);
    assert(atenderRes.body.data?.atendida === true, 'Estado de la alerta actualizado inmediatamente a atendida: true');

    // -------------------------------------------------------------
    // BLOQUE 8: Cierre de Turno y Control de Integridad (Lote Cerrado)
    // -------------------------------------------------------------
    console.log('\n🔒 BLOQUE 8: Cierre de Turno y Control de Integridad Operativa');
    
    // Finalizar lote
    const finLoteRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(finLoteRes.statusCode === 200, 'PATCH /api/lotes/:id/finalizar responde 200 OK');
    assert(finLoteRes.body.data?.estado === 'FINALIZADO', 'Estado del lote actualizado a FINALIZADO');
    assert(finLoteRes.body.data?.fecha_fin !== null, 'Fecha de fin registrada en base de datos');

    // Intento de nueva inspección en lote cerrado -> Debe responder 400 Bad Request
    const intentoInspeccionCerrada = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Intento extemporáneo en lote cerrado'
      }
    });
    assert(intentoInspeccionCerrada.statusCode === 400, 'Intento de inspección en lote FINALIZADO es rechazado con 400 Bad Request');
    assert(
      JSON.stringify(intentoInspeccionCerrada.body).includes('FINALIZADO') ||
      JSON.stringify(intentoInspeccionCerrada.body).includes('EN_PROCESO'),
      'Mensaje de error especifica que el lote ya no se encuentra EN_PROCESO'
    );

    // Intento de doble cierre de lote -> 400 Bad Request
    const dobleFinRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(dobleFinRes.statusCode === 400, 'Intento de doble finalización de lote es rechazado con 400 Bad Request');

    // -------------------------------------------------------------
    // BLOQUE 9: Auditoría Histórica con Filtros por Lote y Resultado
    // -------------------------------------------------------------
    console.log('\n📋 BLOQUE 9: Auditoría Histórica y Trazabilidad Completa');

    // Consulta filtrada por lote_id y estado = RECHAZADO
    const auditoriaRechazoRes = await request({
      method: 'GET',
      path: `/api/inspecciones?lote_id=${loteId}&estado=RECHAZADO`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(auditoriaRechazoRes.statusCode === 200, 'Auditoría filtrada por lote y RECHAZADO responde 200 OK');
    const rechazosEncontrados = auditoriaRechazoRes.body.inspecciones || auditoriaRechazoRes.body.data || [];
    assert(rechazosEncontrados.length === 1, 'Se obtiene con precisión la inspección con falla');
    assert(rechazosEncontrados[0].tipos_defecto !== null, 'Trazabilidad: inspección incluye relación con tipo de defecto');
    assert(rechazosEncontrados[0].usuarios !== null, 'Trazabilidad: inspección incluye usuario operario que registró');

    // Consulta filtrada por lote_id y estado = APROBADO
    const auditoriaAprobadoRes = await request({
      method: 'GET',
      path: `/api/inspecciones?lote_id=${loteId}&estado=APROBADO`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(auditoriaAprobadoRes.statusCode === 200, 'Auditoría filtrada por lote y APROBADO responde 200 OK');
    const aprobadosEncontrados = auditoriaAprobadoRes.body.inspecciones || auditoriaAprobadoRes.body.data || [];
    assert(aprobadosEncontrados.length === 1, 'Se obtiene con precisión la inspección aprobada');

    // Total de inspecciones del lote
    const auditoriaTotalRes = await request({
      method: 'GET',
      path: `/api/inspecciones?lote_id=${loteId}`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    const totalEncontrados = auditoriaTotalRes.body.inspecciones || auditoriaTotalRes.body.data || [];
    assert(totalEncontrados.length === 2, 'Total de auditoría para el lote coincide con 2 eventos');

    // -------------------------------------------------------------
    // RESUMEN FINAL DE LA SUITE
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('🏆 SUITE E2E SEMANA 06 — RESULTADOS FINALES:');
    console.log(`   ✅ Pruebas aprobadas: ${passCount}`);
    console.log(`   ❌ Pruebas fallidas:  ${failCount}`);
    console.log('   🎉 Flujo End-to-End validado al 100% de punta a punta.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR EN LA EJECUCIÓN DE PRUEBAS E2E S6:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
};

require('dotenv').config();
runWeek6E2ETests();
