/**
 * Script de Simulación Masiva y Pruebas de Estrés — KIT AVZ-02
 * Proyecto: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
 * 
 * Uso:
 *   node scripts/simulador-kit.js [--envase=FRASCO|LATA] [--cantidad=15] [--cadencia=500] [--provocar-atasco] [--fallas-consecutivas]
 */

'use strict';

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
require('dotenv').config();

const API_HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.PORT || 3008;

// Parámetros CLI
const args = process.argv.slice(2).reduce((acc, curr) => {
  if (curr.startsWith('--')) {
    const [key, value] = curr.replace(/^--/, '').split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const TIPO_ENVASE = (args.envase || 'FRASCO').toUpperCase();
const CANTIDAD = parseInt(args.cantidad || 10, 10);
const CADENCIA_MS = parseInt(args.cadencia || 600, 10);
const PROVOCAR_ATASCO = Boolean(args['provocar-atasco']);
const FORZAR_CONSECUTIVAS = Boolean(args['fallas-consecutivas']);

const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = { ...headers };

    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      `http://${API_HOST}:${PORT}${path}`,
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
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('\n================================================================');
  console.log('🤖 SIMULADOR INDUSTRIAL DE VISIÓN ARTIFICIAL — KIT AVZ-02');
  console.log(`   Línea: ${TIPO_ENVASE} | Cantidad: ${CANTIDAD} envases | Cadencia: ${CADENCIA_MS}ms`);
  console.log('================================================================\n');

  const server = app.listen(PORT);

  try {
    // 1. Login como Operario
    console.log('🔑 Autenticando operador del sensor...');
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operario@nutriscan.com', password: '123456' }
    });

    if (loginRes.statusCode !== 200 || !loginRes.body.data?.token) {
      throw new Error(`Fallo en autenticación: ${JSON.stringify(loginRes.body)}`);
    }

    const token = loginRes.body.data.token;
    console.log('   ✅ Operario autenticado exitosamente.');

    // 2. Obtener lote activo
    console.log(`\n🔍 Verificando lote activo en línea ${TIPO_ENVASE}...`);
    let loteRes = await request({
      method: 'GET',
      path: `/api/lotes/activo?tipo_envase=${TIPO_ENVASE}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    let lote = loteRes.body.data;

    // Si no hay lote en proceso, solicitar apertura con token de supervisor
    if (!lote || lote.estado !== 'EN_PROCESO') {
      console.log('   ⚠️ No se detectó lote EN_PROCESO. Solicitando apertura como Supervisor...');
      const supLogin = await request({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: 'supervisor@nutriscan.com', password: '123456' }
      });
      const supToken = supLogin.body.data.token;

      const nuevoCodigo = `LOTE-${TIPO_ENVASE}-SIM-${Date.now().toString().slice(-4)}`;
      const nuevoLoteRes = await request({
        method: 'POST',
        path: '/api/lotes',
        headers: { Authorization: `Bearer ${supToken}` },
        body: {
          codigo_lote: nuevoCodigo,
          producto: TIPO_ENVASE === 'FRASCO' ? 'Salsa de Tomate Pomodoro 500g' : 'Maíz Dulce en Grano 300g',
          tipo_envase: TIPO_ENVASE
        }
      });
      lote = nuevoLoteRes.body.data;
      console.log(`   ✅ Nuevo lote aperturado: ${lote.codigo_lote} (ID: ${lote.id})`);
    } else {
      console.log(`   ✅ Lote en proceso vinculado: ${lote.codigo_lote} (ID: ${lote.id})`);
    }

    // 3. Obtener catálogo de defectos
    const defectosRes = await request({
      method: 'GET',
      path: `/api/tipos-defecto?tipo_envase=${TIPO_ENVASE}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    const catalogoDefectos = defectosRes.body.data || [];
    console.log(`   📋 Tipos de defectos cargados: ${catalogoDefectos.length}`);

    // Actuadores de rechazo disponibles
    const actuadoresRechazo = [
      'Pistón Neumático a 6.2 bar (Expulsión a tolva de descarte)',
      'Brazo Expulsor Electromecánico (Separador de flujo)',
      'Compuerta Servomotor de Desviación de Carril'
    ];

    // 4. Iniciar bucle de simulación e ingestión
    console.log('\n🚀 INICIANDO INGESTIÓN AUTOMÁTICA DE INSPECCIONES...');
    let aprobados = 0;
    let rechazados = 0;
    let consecutivas = 0;
    let paradaActivada = false;

    for (let i = 1; i <= CANTIDAD; i++) {
      if (paradaActivada) {
        console.log('\n🛑 SIMULACIÓN DETENIDA: La máquina se encuentra en Parada de Emergencia.');
        break;
      }

      await delay(CADENCIA_MS);

      // Decidir si es conforme o rechazo
      let esDefecto = Math.random() < 0.25;
      if (FORZAR_CONSECUTIVAS && i >= 2 && i <= 4) esDefecto = true;
      if (PROVOCAR_ATASCO && i === Math.floor(CANTIDAD / 2)) esDefecto = true;

      if (!esDefecto) {
        // CONFORME
        consecutivas = 0;
        const resp = await request({
          method: 'POST',
          path: '/api/inspecciones',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            lote_id: lote.id,
            estado: 'APROBADO',
            observacion: `Pieza #${i} conforme verificada por sensor AVZ-02`
          }
        });

        if (resp.statusCode === 201) {
          aprobados++;
          console.log(`   [${i}/${CANTIDAD}] 🟢 CONFORME #${resp.body.data?.id || i} (Lote: ${lote.codigo_lote})`);
        } else {
          console.error(`   ❌ Error al registrar pieza #${i}:`, resp.body);
        }
      } else {
        // DEFECTO / RECHAZO
        consecutivas++;
        rechazados++;

        const defecto = catalogoDefectos[Math.floor(Math.random() * catalogoDefectos.length)] || {
          id: 1, codigo: 'FALLA', nombre: 'Defecto visual'
        };

        const actuador = actuadoresRechazo[Math.floor(Math.random() * actuadoresRechazo.length)];

        let obs = `Falla [${defecto.codigo}]. Actuador activado: ${actuador}`;
        if (PROVOCAR_ATASCO && i === Math.floor(CANTIDAD / 2)) {
          obs = `🚨 PARADA DE EMERGENCIA: Atascamiento mecánico detectado en carril. Envase fisurado obstruye el paso.`;
        } else if (consecutivas >= 3) {
          obs = `🚨 PARADA DE EMERGENCIA: Detección crítica de 3 fallas consecutivas en línea.`;
        }

        const resp = await request({
          method: 'POST',
          path: '/api/inspecciones',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            lote_id: lote.id,
            tipo_defecto_id: defecto.id,
            estado: 'RECHAZADO',
            observacion: obs,
            imagen_url: `/simulador/${TIPO_ENVASE.toLowerCase()}_${defecto.codigo.toLowerCase()}.png`
          }
        });

        if (resp.statusCode === 201) {
          console.log(`   [${i}/${CANTIDAD}] 🔴 RECHAZO #${resp.body.data?.id || i} - [${defecto.codigo}] ${defecto.nombre}`);
          console.log(`       ⚙️ Mecanismo: ${actuador}`);
          if (resp.body.data?.alertas && resp.body.data.alertas.length > 0) {
            console.log(`       🔔 Alerta generada ID #${resp.body.data.alertas[0].id} (Nivel: ${resp.body.data.alertas[0].nivel})`);
          }
        }

        // Evaluar condiciones de Parada de Emergencia
        if (PROVOCAR_ATASCO && i === Math.floor(CANTIDAD / 2)) {
          console.log('\n🚨 ==============================================================');
          console.log('🚨 DISPARO DE PARADA DE EMERGENCIA: ATASCAMIENTO MECÁNICO');
          console.log('   Envase trabado en cinta transportadora. Sensor de atasco en ALTO.');
          console.log('==============================================================');
          paradaActivada = true;
        } else if (consecutivas >= 3) {
          console.log('\n🚨 ==============================================================');
          console.log('🚨 DISPARO DE PARADA DE EMERGENCIA: 3 FALLAS CONSECUTIVAS');
          console.log('   Límite de fallas continuas excedido. Deteniendo cabezal de visión.');
          console.log('==============================================================');
          paradaActivada = true;
        }
      }
    }

    // 5. Resumen final de la simulación
    console.log('\n================================================================');
    console.log('📊 RESUMEN FINAL DEL KIT AVZ-02:');
    console.log(`   Lote Procesado:      ${lote.codigo_lote}`);
    console.log(`   Unidades Procesadas: ${aprobados + rechazados}`);
    console.log(`   Piezas Conformes:    ${aprobados} (${(((aprobados || 0) / (aprobados + rechazados || 1)) * 100).toFixed(1)}%)`);
    console.log(`   Piezas Rechazadas:   ${rechazados} (${(((rechazados || 0) / (aprobados + rechazados || 1)) * 100).toFixed(1)}%)`);
    console.log(`   Estado Parada Emerg: ${paradaActivada ? '🚨 ACTIVADA' : '🟢 NORMAL'}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR EN EL SIMULADOR KIT AVZ-02:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

main();
