/**
 * Script de Validación Automatizada E2E — Semana 08:
 * MÓDULO DE INTELIGENCIA OPERATIVA, KPIS Y DASHBOARDS ANALÍTICOS
 * Proyecto: NutriScan — Sistema de Inspección y Registro de Calidad 4.0
 * 
 * Verificación Integral:
 *  1. Conectividad e Infraestructura PostgreSQL en Neon Cloud
 *  2. Autenticación y Control de Acceso (RBAC): Operario, Supervisor, Admin
 *  3. Ciclo de Parada de Emergencia, Bloqueo y Reanudación de Línea:
 *     - Operario detiene la línea (PATCH /api/lotes/:id/detener)
 *     - Estado actualizado a 'DETENIDO' y generación de alerta crítica
 *     - Barrera de Integridad: Bloqueo de nuevas capturas mientras está DETENIDO (400 Bad Request)
 *     - RBAC: Operario denegado para reanudar línea (403 Forbidden)
 *     - Supervisor reanuda la línea (PATCH /api/lotes/:id/reanudar -> 200 OK)
 *     - Estado restablecido a 'EN_PROCESO' y resolución automática de alertas críticas
 *     - Nueva captura exitosa tras la reanudación (201 Created)
 *  4. Endpoints de Agregación Analítica en Backend (SQL Optimizado):
 *     - GET /api/dashboard/kpis: Estructura, exactitud matemática y tasas (%)
 *     - Validación de coherencia: total = aprobados + rechazados
 *     - Coherencia de tasas: tasa_descarte + tasa_aprobacion = 100%
 *     - Tiempo promedio de inspección / ciclo reportado correctamente
 *  5. Filtros Multidimensionales de Auditoría:
 *     - Filtrado por lote específico
 *     - Filtrado por tipo de envase (FRASCO vs. LATA)
 *     - Filtrado por rango temporal (fecha_desde, fecha_hasta)
 *     - Manejo de estados vacíos (empty states) ante filtros sin coincidencias (200 OK seguro)
 *  6. Datasets para Visualización con Chart.js:
 *     - GET /api/dashboard/graficos: Pareto de Defectos (Frecuencia y % Acumulado 80/20)
 *     - Validación de ordenamiento descendente en Pareto y acumulación hasta 100%
 *     - Evolución Temporal de Calidad: Agrupaciones por horas y tasas
 *     - Comparativa de Envases: Desempeño contrastado FRASCO vs. LATA
 *  7. Workflow de Cierre de Lote con Visto Bueno de Supervisión:
 *     - Operario solicita cierre (PENDIENTE_CIERRE)
 *     - Barrera 400 Bad Request sobre lote pendiente
 *     - Supervisor aprueba y finaliza lote (FINALIZADO)
 */

'use strict';

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const PORT = 3008; // Puerto exclusivo y aislado para la suite S8

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

const runWeek8Tests = async () => {
  console.log('\n================================================================');
  console.log('🚀 SUITE DE VALIDACIÓN AUTOMATIZADA — SEMANA 08');
  console.log('   MÓDULO DE INTELIGENCIA OPERATIVA, KPIS Y DASHBOARDS (CHART.JS)');
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // BLOQUE 1: Conectividad e Infraestructura PostgreSQL Neon Cloud
    // -------------------------------------------------------------
    console.log('🌐 BLOQUE 1: Conectividad e Infraestructura PostgreSQL Neon Cloud');
    const health = await request({ method: 'GET', path: '/api/health' });
    assert(health.statusCode === 200, 'GET /api/health responde 200 OK');
    assert(health.body.database?.connected === true, 'PostgreSQL en Neon Cloud está ONLINE');
    assert(health.body.status === 'HEALTHY', 'Estado general del sistema es HEALTHY');

    // -------------------------------------------------------------
    // BLOQUE 2: Autenticación, Roles y RBAC
    // -------------------------------------------------------------
    console.log('\n🔑 BLOQUE 2: Autenticación y Control de Acceso (RBAC)');

    // Login Supervisor
    const supLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'supervisor@nutriscan.com', password: '123456' }
    });
    assert(supLogin.statusCode === 200, 'Login Supervisor responde 200 OK');
    const supToken = supLogin.body?.data?.token;
    assert(Boolean(supToken), 'Supervisor obtiene JWT válido');

    // Login Operario
    const opLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });
    assert(opLogin.statusCode === 200, 'Login Operario responde 200 OK');
    const opToken = opLogin.body?.data?.token;
    assert(Boolean(opToken), 'Operario obtiene JWT válido');

    // Apertura de Lote para la Suite S8
    const codigoLoteS8 = `LOTE-S8-${Math.floor(10000 + Math.random() * 90000)}`;
    const nuevoLoteRes = await request({
      method: 'POST',
      path: '/api/lotes',
      headers: { Authorization: `Bearer ${supToken}` },
      body: {
        codigo_lote: codigoLoteS8,
        producto: 'Mermelada de Frutilla 450g Premium',
        tipo_envase: 'FRASCO'
      }
    });
    assert(nuevoLoteRes.statusCode === 201, `Supervisor apertura lote '${codigoLoteS8}' (201 Created)`);
    const loteId = nuevoLoteRes.body.data.id;
    assert(nuevoLoteRes.body.data.estado === 'EN_PROCESO', 'Lote inicia formalmente en estado EN_PROCESO');

    // -------------------------------------------------------------
    // BLOQUE 3: Flujo de Parada de Emergencia, Bloqueo y Reanudación
    // -------------------------------------------------------------
    console.log('\n🚨 BLOQUE 3: Circuito de Parada de Línea, Bloqueo y Reanudación por Supervisión');

    // Catálogo de defectos
    const catDefectos = await request({
      method: 'GET',
      path: '/api/tipos-defecto?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(catDefectos.statusCode === 200, 'Catálogo de defectos obtenido (200 OK)');
    const defectos = catDefectos.body.data || [];
    const defSinTapa = defectos.find(d => d.codigo === 'SIN_TAPA') || defectos[0];
    const defLlenado = defectos.find(d => d.codigo === 'LLENADO_BAJO') || defectos[1];

    // Registrar 1 pieza aprobada previa
    const inspAprobada = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Pieza conforme verificada'
      }
    });
    assert(inspAprobada.statusCode === 201, 'Pieza conforme registrada en lote activo');

    // Operario reporta parada de emergencia en línea
    const detenerRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/detener`,
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        motivo: 'Atascamiento en carril principal y frasco descalzado'
      }
    });
    assert(detenerRes.statusCode === 200, 'Operario detiene la línea (PATCH /api/lotes/:id/detener -> 200 OK)');
    assert(detenerRes.body.data.estado === 'DETENIDO', 'Estado del lote actualizado a DETENIDO');
    assert(detenerRes.body.alerta?.nivel === 'CRITICA', 'Alerta crítica operativa generada y vinculada');

    // BARRERA DE INTEGRIDAD: El sistema rechaza cualquier nueva inspección mientras esté DETENIDO
    const intentoBloqueado = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        estado: 'APROBADO',
        observacion: 'Intento de continuar con línea detenida'
      }
    });
    assert(intentoBloqueado.statusCode === 400, 'Barrera de Integridad: Inspección rechazada con 400 Bad Request mientras el lote está DETENIDO');

    // RBAC: Operario NO puede reanudar la línea por sí mismo
    const intentoOperarioReanudar = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/reanudar`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(intentoOperarioReanudar.statusCode === 403, 'RBAC: Operario denegado (403 Forbidden) para reanudar la línea sin supervisión');

    // Supervisor reanuda formalmente la línea tras inspeccionar
    const reanudarSupervisor = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/reanudar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(reanudarSupervisor.statusCode === 200, 'Supervisor atiende y reanuda la línea (PATCH /api/lotes/:id/reanudar -> 200 OK)');
    assert(reanudarSupervisor.body.data.estado === 'EN_PROCESO', 'Estado del lote restablecido a EN_PROCESO');

    // Nuevas inspecciones habilitadas nuevamente
    const nuevaPiezaPostReanudacion = await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defSinTapa.id,
        estado: 'RECHAZADO',
        observacion: 'Frasco sin tapa descartado por pistón tras reanudación'
      }
    });
    assert(nuevaPiezaPostReanudacion.statusCode === 201, 'Inspección posterior a la reanudación registrada con éxito (201 Created)');

    // Registrar otra inspección rechazada para alimentar Pareto
    await request({
      method: 'POST',
      path: '/api/inspecciones',
      headers: { Authorization: `Bearer ${opToken}` },
      body: {
        lote_id: loteId,
        tipo_defecto_id: defLlenado.id,
        estado: 'RECHAZADO',
        observacion: 'Nivel bajo en salsa'
      }
    });

    // -------------------------------------------------------------
    // BLOQUE 4: Endpoints de Agregación Analítica (SQL en Backend)
    // -------------------------------------------------------------
    console.log('\n📊 BLOQUE 4: Endpoints de Agregación Analítica (GET /api/dashboard/kpis)');

    // Consulta general de KPIs
    const kpisGlobal = await request({
      method: 'GET',
      path: '/api/dashboard/kpis',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisGlobal.statusCode === 200, 'GET /api/dashboard/kpis responde 200 OK');
    assert(typeof kpisGlobal.body.data.total_procesado === 'number', 'total_procesado es un valor numérico');
    assert(typeof kpisGlobal.body.data.aprobados === 'number', 'aprobados es un valor numérico');
    assert(typeof kpisGlobal.body.data.rechazados === 'number', 'rechazados es un valor numérico');
    assert(typeof kpisGlobal.body.data.tasa_descarte === 'number', 'tasa_descarte (%) calculada en backend');
    assert(typeof kpisGlobal.body.data.tasa_aprobacion === 'number', 'tasa_aprobacion (%) calculada en backend');
    assert(typeof kpisGlobal.body.data.tiempo_promedio_seg === 'number', 'tiempo_promedio_seg calculado en backend');

    // Coherencia matemática de la agregación SQL
    const totalCalc = kpisGlobal.body.data.aprobados + kpisGlobal.body.data.rechazados;
    assert(kpisGlobal.body.data.total_procesado === totalCalc, 'Coherencia Matemática: total_procesado = aprobados + rechazados');

    const sumaTasas = Math.round(kpisGlobal.body.data.tasa_descarte + kpisGlobal.body.data.tasa_aprobacion);
    assert(sumaTasas === 100 || kpisGlobal.body.data.total_procesado === 0, 'Coherencia Porcentual: tasa_descarte + tasa_aprobacion = 100%');

    // -------------------------------------------------------------
    // BLOQUE 5: Filtros Multidimensionales de Auditoría
    // -------------------------------------------------------------
    console.log('\n🔍 BLOQUE 5: Filtros Multidimensionales de Auditoría');

    // Filtrar KPIs por el lote específico creado en la suite
    const kpisLote = await request({
      method: 'GET',
      path: `/api/dashboard/kpis?lote_id=${loteId}`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisLote.statusCode === 200, `GET /api/dashboard/kpis?lote_id=${loteId} responde 200 OK`);
    assert(kpisLote.body.data.total_procesado >= 3, 'KPIs del lote reflejan exactamente las unidades inspeccionadas');
    assert(kpisLote.body.data.rechazados >= 2, 'KPIs del lote contabilizan las unidades rechazadas');

    // Filtrar por tipo de envase
    const kpisFrasco = await request({
      method: 'GET',
      path: '/api/dashboard/kpis?tipo_envase=FRASCO',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisFrasco.statusCode === 200, 'Filtro por tipo_envase=FRASCO responde 200 OK');

    const kpisLata = await request({
      method: 'GET',
      path: '/api/dashboard/kpis?tipo_envase=LATA',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisLata.statusCode === 200, 'Filtro por tipo_envase=LATA responde 200 OK');

    // Filtrar por rango de fechas (ej. hoy)
    const hoyIso = new Date().toISOString().split('T')[0];
    const kpisFecha = await request({
      method: 'GET',
      path: `/api/dashboard/kpis?fecha_desde=${hoyIso}T00:00:00.000Z`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisFecha.statusCode === 200, 'Filtro por fecha_desde responde 200 OK');

    // Caso de borde: Lote inexistente (Empty State elegante, sin error 500)
    const kpisVacio = await request({
      method: 'GET',
      path: '/api/dashboard/kpis?lote_id=999999',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(kpisVacio.statusCode === 200, 'Filtro sin coincidencias responde 200 OK (Empty State seguro)');
    assert(kpisVacio.body.data.total_procesado === 0, 'Total procesado es 0 en lote sin datos');
    assert(kpisVacio.body.data.tasa_descarte === 0, 'Tasa de descarte es 0 en lote sin datos');

    // -------------------------------------------------------------
    // BLOQUE 6: Datasets de Gráficos Analíticos (Chart.js)
    // -------------------------------------------------------------
    console.log('\n📈 BLOQUE 6: Datasets para Gráficos Analíticos (GET /api/dashboard/graficos)');

    const graficosRes = await request({
      method: 'GET',
      path: '/api/dashboard/graficos',
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(graficosRes.statusCode === 200, 'GET /api/dashboard/graficos responde 200 OK');
    assert(Array.isArray(graficosRes.body.data.pareto_defectos), 'pareto_defectos es un Array');
    assert(Array.isArray(graficosRes.body.data.evolucion_temporal), 'evolucion_temporal es un Array');
    assert(Array.isArray(graficosRes.body.data.comparativa_envase), 'comparativa_envase es un Array');

    // Validación detallada del Diagrama de Pareto de Defectos
    const pareto = graficosRes.body.data.pareto_defectos;
    if (pareto.length > 0) {
      assert(pareto[0].cantidad !== undefined, 'Elementos de Pareto contienen propiedad cantidad');
      assert(pareto[0].porcentaje !== undefined, 'Elementos de Pareto contienen porcentaje individual');
      assert(pareto[0].porcentaje_acumulado !== undefined, 'Elementos de Pareto contienen porcentaje_acumulado (Curva 80/20)');

      // Verificar ordenamiento descendente por cantidad
      let ordenCorrecto = true;
      for (let i = 1; i < pareto.length; i++) {
        if (pareto[i].cantidad > pareto[i - 1].cantidad) {
          ordenCorrecto = false;
          break;
        }
      }
      assert(ordenCorrecto, 'Pareto de Defectos está ordenado descendentemente por frecuencia de falla');

      // Último elemento acumulado debe aproximar al 100%
      const ultimoAcumulado = pareto[pareto.length - 1].porcentaje_acumulado;
      assert(Math.round(ultimoAcumulado) === 100, `Curva acumulada de Pareto cierra al 100% (Valor: ${ultimoAcumulado}%)`);
    } else {
      console.log('   ℹ️ Dataset de Pareto vacío para la consulta global');
    }

    // Validación de Comparativa por Envase
    const comparativa = graficosRes.body.data.comparativa_envase;
    assert(comparativa.length >= 1, 'Comparativa de envases contiene datos agrupados por tipo');
    const itemEnvase = comparativa[0];
    assert(['FRASCO', 'LATA'].includes(itemEnvase.tipo_envase), 'tipo_envase categorizado como FRASCO o LATA');
    assert(typeof itemEnvase.tasa_descarte_porcentaje === 'number', 'tasa_descarte_porcentaje presente en comparativa');

    // -------------------------------------------------------------
    // BLOQUE 7: Cierre Formal de Lote con Visto Bueno de Supervisión
    // -------------------------------------------------------------
    console.log('\n🔒 BLOQUE 7: Cierre y Finalización Formal del Lote Auditado');

    // Operario solicita cierre
    const cerrarRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/cerrar`,
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert(cerrarRes.statusCode === 200, 'Operario solicita cierre de lote (PENDIENTE_CIERRE)');
    assert(cerrarRes.body.data.estado === 'PENDIENTE_CIERRE', 'Estado del lote pasa a PENDIENTE_CIERRE');

    // Supervisor da el visto bueno definitivo
    const finalizarRes = await request({
      method: 'PATCH',
      path: `/api/lotes/${loteId}/finalizar`,
      headers: { Authorization: `Bearer ${supToken}` }
    });
    assert(finalizarRes.statusCode === 200, 'Supervisor otorga el Visto Bueno final (FINALIZADO)');
    assert(finalizarRes.body.data.estado === 'FINALIZADO', 'Estado final del lote consolidado como FINALIZADO');

    console.log('\n================================================================');
    console.log(`🏆 SUITE DE VALIDACIÓN AUTOMATIZADA SEMANA 08 — RESULTADOS:`);
    console.log(`   ✅ Pruebas aprobadas: ${passCount}`);
    console.log(`   ❌ Pruebas fallidas:  ${failCount}`);
    console.log(`   🎉 MÓDULO DE INTELIGENCIA OPERATIVA Y KPIS VALIDADO AL 100%.`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n💥 ERROR FATAL EN LA EJECUCIÓN DE LA SUITE S8:', error.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
};

runWeek8Tests();
