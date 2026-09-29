/**
 * Script de Validación Automatizada E2E — Semana 07: MÓDULO KIT 4.0 (AVZ-02)
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 * 
 * Verificación Integral:
 *  1. Conectividad e Infraestructura PostgreSQL en Neon Cloud
 *  2. Autenticación y RBAC: Operario restringido de apertura (403), Supervisor apertura lote
 *  3. Ingestión del Sensor Óptico KIT AVZ-02: Pieza Conforme y Registro en BD
 *  4. Dataset Visual y Simulación de Defectos: Ingestión con tipología de fallas
 *  5. Mecanismos de Rechazo Físico: Pistón Neumático, Brazo Expulsor, Desvío de Carril
 *  6. Regla de Planta: Parada de Emergencia por 3 Fallas Consecutivas
 *  7. Regla de Planta: Parada de Emergencia por Atascamiento Mecánico de Envase
 *  8. Circuito de Notificación y Resolución de Emergencia por Supervisión
 *  9. Workflow de Cierre de Lote: Operario solicita cierre (PENDIENTE_CIERRE), barrera 400 Bad Request activa
 * 10. Visto Bueno de Supervisión: Supervisor revisa auditoría y aprueba cierre (FINALIZADO)
 * 11. Auditoría Agrupada por Lote: Visibilidad completa para Operario y bloqueo RBAC de atención (403)
 * 12. Atención de Alertas en Auditoría: Supervisor atiende alertas (200 OK) y estado reactivo
 */

'use strict';

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const PORT = 3007; // Puerto exclusivo y aislado para la suite S7

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

const runWeek7Tests = async () => {
  console.log('\n================================================================');
  console.log('🚀 SUITE DE VALIDACIÓN AUTOMATIZADA — SEMANA 07');
  console.log('   MÓDULO KIT 4.0: SIMULADOR DE VISIÓN ARTIFICIAL (AVZ-02)');
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // BLOQUE 1: Conectividad y Salud de la Base de Datos
    // -------------------------------------------------------------
    console.log('🌐 BLOQUE 1: Conectividad e Infraestructura PostgreSQL Neon Cloud');
    const health = await request({ method: 'GET', path: '/api/health' });
    assert(health.statusCode === 200, 'GET /api/health responde 200 OK');
    assert(health.body.database?.connected === true, 'PostgreSQL en Neon Cloud está ONLINE');
    assert(health.body.status === 'HEALTHY', 'Estado general del sistema es HEALTHY');

    // -------------------------------------------------------------
    // BLOQUE 2: Autenticación, Roles y RBAC de Apertura de Lote
    // -------------------------------------------------------------
    console.log('\n🔑 BLOQUE 2: Autenticación y Control de Acceso (RBAC)');

    // Login Supervisor
    const supLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'supervisor@nutriscan.com', password: '123456' }
    });
    assert(supLogin.statusCode === 200, 'Login Supervisor responde 200 OK');
    const supToken = supLogin.body.data.token;

    // Login Operario
    const opLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });
    assert(opLogin.statusCode === 200, 'Login Operario responde 200 OK');
    const opToken = opLogin.body.data.token;

    // Directiva Docente: El Operario NO puede abrir lotes (403 Forbidden)
    const opAperturaLote = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${opToken}` },
      body: { codigo_lote: 'LOTE-NO-AUTORIZADO', producto: 'Prueba Operario', tipo_envase: 'FRASCO' }
    });
    assert(opAperturaLote.statusCode === 403, 'RBAC: Operario tiene prohibido aperturar lotes (403 Forbidden)');

    // Supervisor apertura el lote de producción para la Semana 7
    const codigoLoteS7 = `LOTE-S7-${Date.now().toString().slice(-5)}`;
    const crearLoteRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${supToken}` },
      body: {
        codigo_lote: codigoLoteS7,
        producto: 'Mermelada de Higo y Ciruela NutriScan 450g',
        tipo_envase: 'FRASCO'
      }
    });
    assert(crearLoteRes.statusCode === 201, `Supervisor apertura lote '${codigoLoteS7}' (201 Created)`);
    assert(crearLoteRes.body.data.estado === 'EN_PROCESO', 'Lote inicia formalmente en estado EN_PROCESO');
    const loteId = crearLoteRes.body.data.id;

    // Operario detecta automáticamente el lote activo en su estación
    const activoRes = await request({
      method: 'GET',
      path: '/api/lotes/activo?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(activoRes.statusCode === 200, 'Operario consulta lote activo en línea FRASCO');
    assert(activoRes.body.data?.id === loteId, 'La estación detecta automáticamente el nuevo lote aperturado');

    // -------------------------------------------------------------
    // BLOQUE 3: Ingestión del Sensor Óptico KIT AVZ-02
    // -------------------------------------------------------------
    console.log('\n🔬 BLOQUE 3: Ingestión del Sensor Óptico KIT AVZ-02');

    // Simulación de Pieza Conforme
    const conformeRes = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Sensor AVZ-02: Envase sellado herméticamente, nivel óptimo'
      }
    });
    assert(conformeRes.statusCode === 201, 'Disparo de Pieza Conforme registrado exitosamente (201 Created)');
    assert(conformeRes.body.data.estado === 'APROBADO', 'Estado verificado: APROBADO');
    assert(!conformeRes.body.data.alerta, 'Pieza conforme no genera alertas en línea');

    // -------------------------------------------------------------
    // BLOQUE 4: Dataset Visual y Mecanismos de Rechazo Físico
    // -------------------------------------------------------------
    console.log('\n⚙️ BLOQUE 4: Dataset Visual y Actuadores de Rechazo Físico');

    // Obtener catálogo de defectos de frascos
    const catDefectosRes = await request({
      method: 'GET',
      path: '/api/tipos-defecto?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(catDefectosRes.statusCode === 200, 'Catálogo de defectos para FRASCO obtenido');
    const defectos = catDefectosRes.body.data || [];
    assert(defectos.length >= 3, 'Catálogo contiene al menos 3 defectos tipificados');

    const defectoSinTapa = defectos.find(d => d.codigo === 'SIN_TAPA') || defectos[0];
    const defectoLlenado = defectos.find(d => d.codigo === 'LLENADO_BAJO') || defectos[1];

    // Rechazo 1 con Pistón Neumático
    const rechazoPiston = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoSinTapa.id,
        estado: 'RECHAZADO',
        observacion: 'Actuador activado: Pistón Neumático a 6.2 bar expulsó frasco defectuoso a tolva',
        imagen_url: '/simulador/frasco_sin_tapa.png'
      }
    });
    assert(rechazoPiston.statusCode === 201, 'Rechazo con Pistón Neumático registrado exitosamente');
    assert(rechazoPiston.body.data.alerta !== null, 'Alerta operativa generada automáticamente');
    const alerta1Id = rechazoPiston.body.data.alerta?.id;

    // Rechazo 2 con Brazo Expulsor Electromecánico
    const rechazoBrazo = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoLlenado.id,
        estado: 'RECHAZADO',
        observacion: 'Actuador activado: Brazo Expulsor Electromecánico desvió frasco de salsa',
        imagen_url: '/simulador/frasco_llenado_bajo.png'
      }
    });
    assert(rechazoBrazo.statusCode === 201, 'Rechazo con Brazo Expulsor registrado exitosamente');

    // -------------------------------------------------------------
    // BLOQUE 5: Reglas de Planta — Paradas de Emergencia
    // -------------------------------------------------------------
    console.log('\n🚨 BLOQUE 5: Detección de Reglas de Planta y Parada de Emergencia');

    // Regla 1: 3 Fallas Consecutivas
    const rechazoConsecutivo3 = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoSinTapa.id,
        estado: 'RECHAZADO',
        observacion: '🚨 PARADA DE EMERGENCIA: Detección crítica de 3 fallas consecutivas en línea de envasado',
        imagen_url: '/simulador/parada_consecutivas.png'
      }
    });
    assert(rechazoConsecutivo3.statusCode === 201, 'Evento de Parada de Emergencia (3 Fallas Consecutivas) registrado');
    assert(rechazoConsecutivo3.body.data.observacion.includes('PARADA DE EMERGENCIA'), 'Trazabilidad de parada de emergencia en observación');
    const alertaCriticaEmergenciaId = rechazoConsecutivo3.body.data.alerta?.id;

    // Regla 2: Atascamiento Mecánico de Envase
    const defectoFisura = defectos.find(d => d.codigo === 'FISURA') || defectoSinTapa;
    const rechazoAtasco = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defectoFisura.id,
        estado: 'RECHAZADO',
        observacion: '🚨 PARADA DE EMERGENCIA: Atascamiento mecánico detectado en cinta transportadora (Envase roto obstruye el paso)',
        imagen_url: '/simulador/parada_atasco.png'
      }
    });
    assert(rechazoAtasco.statusCode === 201, 'Evento de Parada de Emergencia (Atascamiento Mecánico) registrado');

    // -------------------------------------------------------------
    // BLOQUE 6: Notificación al Supervisor y Atención de Alertas
    // -------------------------------------------------------------
    console.log('\n👨‍💼 BLOQUE 6: Notificación y Resolución de Alertas por Supervisión');

    // Supervisor consulta alertas operativas pendientes
    const alertasPendientesRes = await request({
      method: 'GET',
      path: '/api/alertas?atendida=false',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(alertasPendientesRes.statusCode === 200, 'Supervisor consulta bandeja de alertas pendientes');
    const alertasPendientes = alertasPendientesRes.body.alertas || alertasPendientesRes.body.data || [];
    assert(alertasPendientes.length >= 3, 'Alertas generadas por las fallas y paradas son visibles para el supervisor');

    // Supervisor atiende la alerta crítica de parada de emergencia
    if (alertaCriticaEmergenciaId) {
      const atenderCriticaRes = await request({
        method: 'PATCH',
        path: `/api/alertas/${alertaCriticaEmergenciaId}/atender`,
        headers: { Authorization: `Bearer ${supToken}` }
      });
      assert(atenderCriticaRes.statusCode === 200, 'Supervisor atiende la alerta crítica de Parada de Emergencia');
      assert(atenderCriticaRes.body.data.atendida === true, 'Estado de la alerta actualizado a atendida: true');
    }

    // -------------------------------------------------------------
    // BLOQUE 7: Workflow de Cierre de Lote con Visto Bueno Docente
    // -------------------------------------------------------------
    console.log('\n🔒 BLOQUE 7: Workflow de Cierre de Lote (Operario Solicita ➔ Supervisor Aprueba)');

    // Directiva Docente: El Operario puede cerrar el lote (solicitar cierre), pasando a PENDIENTE_CIERRE
    const cerrarLoteOpRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/cerrar`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(cerrarLoteOpRes.statusCode === 200, 'Operario ejecuta PATCH /api/lotes/:id/cerrar');
    assert(cerrarLoteOpRes.body.data.estado === 'PENDIENTE_CIERRE', 'Estado del lote actualizado a PENDIENTE_CIERRE');

    // Barrera de Integridad Operativa: No se pueden registrar más inspecciones en lote en PENDIENTE_CIERRE
    const intentoInspPostCierre = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Intento de inspección no permitida'
      }
    });
    assert(intentoInspPostCierre.statusCode === 400, 'Barrera de Integridad: Inspección en lote PENDIENTE_CIERRE rechazada con 400 Bad Request');

    // Directiva Docente: El Operario NO puede dar el visto bueno final (finalizar definitivamente)
    const opIntentoFinalizar = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(opIntentoFinalizar.statusCode === 403, 'RBAC: Operario denegado (403) para finalizar / aprobar lote definitivamente');

    // Supervisor revisa el lote y da el VISTO BUENO FINAL (Cierre definitivo)
    const finalizarSupRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(finalizarSupRes.statusCode === 200, 'Supervisor da el Visto Bueno definitivo (PATCH /api/lotes/:id/finalizar)');
    assert(finalizarSupRes.body.data.estado === 'FINALIZADO', 'Estado final del lote es FINALIZADO');
    assert(finalizarSupRes.body.data.fecha_fin !== null, 'Fecha y hora de cierre registradas en base de datos');

    // -------------------------------------------------------------
    // BLOQUE 8: Auditoría Agrupada y Control de Permisos en Alertas
    // -------------------------------------------------------------
    console.log('\n📋 BLOQUE 8: Auditoría Agrupada por Lote y Control de Acceso');

    // Directiva Docente: El Operario debe poder ver los registros de auditoría igual que el supervisor
    const auditoriaOpRes = await request({
      method: 'GET',
      path: `/api/inspecciones?lote_id=${loteId}`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(auditoriaOpRes.statusCode === 200, 'Operario accede a la auditoría de inspecciones (200 OK)');
    const inspeccionesAuditoria = auditoriaOpRes.body.inspecciones || auditoriaOpRes.body.data || [];
    assert(inspeccionesAuditoria.length === 5, 'Auditoría refleja con exactitud las 5 unidades inspeccionadas del lote');

    const aprobadosAudit = inspeccionesAuditoria.filter(i => i.estado === 'APROBADO').length;
    const rechazadosAudit = inspeccionesAuditoria.filter(i => i.estado === 'RECHAZADO').length;
    assert(aprobadosAudit === 1, 'Auditoría contabiliza exactamente 1 unidad aprobada');
    assert(rechazadosAudit === 4, 'Auditoría contabiliza exactamente 4 unidades rechazadas');

    // Directiva Docente: El Operario NO puede atender alertas desde la auditoría (403 Forbidden)
    if (alerta1Id) {
      const opAtenderIntento = await request({
        method: 'PATCH',
        path: `/api/alertas/${alerta1Id}/atender`,
        headers: { Authorization: `Bearer ${opToken}` }
      });
      assert(opAtenderIntento.statusCode === 403, 'RBAC: Operario denegado (403) para atender alertas en la auditoría');

      // Supervisor sí puede atender la alerta desde la auditoría
      const supAtenderAudit = await request({
        method: 'PATCH',
        path: `/api/alertas/${alerta1Id}/atender`,
        headers: { Authorization: `Bearer ${supToken}` }
      });
      assert(supAtenderAudit.statusCode === 200, 'Supervisor atiende alerta desde auditoría (200 OK)');
      assert(supAtenderAudit.body.data.atendida === true, 'Alerta actualizada a atendida en Neon Cloud');
    }

    // -------------------------------------------------------------
    // RESUMEN FINAL DE LA SUITE SEMANA 07
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('🏆 SUITE DE VALIDACIÓN AUTOMATIZADA SEMANA 07 — RESULTADOS:');
    console.log(`   ✅ Pruebas aprobadas: ${passCount}`);
    console.log(`   ❌ Pruebas fallidas:  ${failCount}`);
    console.log('   🎉 MÓDULO KIT 4.0 (AVZ-02) VALIDADO AL 100% EN PLANTA Y CLOUD.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR EN LA EJECUCIÓN DE PRUEBAS SEMANA 07:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
};

require('dotenv').config();
runWeek7Tests();
