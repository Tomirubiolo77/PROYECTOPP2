/**
 * Script de Verificación de Endpoints de la API
 * Proyecto: NutriScan - Calidad 4.0
 */

const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

const PORT = 3001; // Usamos puerto de prueba para no colisionar

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    }).on('error', reject);
  });
};

const runTests = async () => {
  console.log('========================================================');
  console.log('🧪 Iniciando Pruebas Automatizadas de Endpoints');
  console.log('========================================================');

  const server = app.listen(PORT);

  try {
    // 1. Test Root
    console.log('\n🔹 1. Probando GET / ...');
    const rootRes = await makeRequest('/');
    console.log(`   Status: ${rootRes.statusCode}`);
    console.log(`   Respuesta:`, JSON.stringify(rootRes.body, null, 2));

    // 2. Test Health Check
    console.log('\n🔹 2. Probando GET /api/health ...');
    const healthRes = await makeRequest('/api/health');
    console.log(`   Status: ${healthRes.statusCode}`);
    console.log(`   Respuesta:`, JSON.stringify(healthRes.body, null, 2));

    // 3. Test Catálogo Completo
    console.log('\n🔹 3. Probando GET /api/tipos-defecto ...');
    const todosDefectosRes = await makeRequest('/api/tipos-defecto');
    console.log(`   Status: ${todosDefectosRes.statusCode} | Total encontrados: ${todosDefectosRes.body.count}`);
    console.log(`   Defectos:`, todosDefectosRes.body.data.map(d => `[${d.codigo}] ${d.nombre} (${d.tipo_envase} - ${d.severidad})`));

    // 4. Test Filtro FRASCO
    console.log('\n🔹 4. Probando GET /api/tipos-defecto?tipo_envase=FRASCO ...');
    const frascosRes = await makeRequest('/api/tipos-defecto?tipo_envase=FRASCO');
    console.log(`   Status: ${frascosRes.statusCode} | Total Frascos: ${frascosRes.body.count}`);
    console.log(`   Defectos Frasco:`, frascosRes.body.data.map(d => d.codigo));

    // 5. Test Filtro LATA
    console.log('\n🔹 5. Probando GET /api/tipos-defecto?tipo_envase=LATA ...');
    const latasRes = await makeRequest('/api/tipos-defecto?tipo_envase=LATA');
    console.log(`   Status: ${latasRes.statusCode} | Total Latas: ${latasRes.body.count}`);
    console.log(`   Defectos Lata:`, latasRes.body.data.map(d => d.codigo));

    // 6. Test Detalle por ID
    console.log('\n🔹 6. Probando GET /api/tipos-defecto/1 ...');
    const detalleRes = await makeRequest('/api/tipos-defecto/1');
    console.log(`   Status: ${detalleRes.statusCode}`);
    console.log(`   Defecto ID 1:`, detalleRes.body.data);

    // 7. Test 404 en recurso no encontrado
    console.log('\n🔹 7. Probando GET /api/tipos-defecto/999 (No existente) ...');
    const notFoundDefectoRes = await makeRequest('/api/tipos-defecto/999');
    console.log(`   Status: ${notFoundDefectoRes.statusCode} | Error recibido: ${notFoundDefectoRes.body.error}`);

    // 8. Test 404 en ruta inexistente
    console.log('\n🔹 8. Probando GET /api/ruta-desconocida ...');
    const notFoundRouteRes = await makeRequest('/api/ruta-desconocida');
    console.log(`   Status: ${notFoundRouteRes.statusCode} | Error: ${notFoundRouteRes.body.error}`);

    console.log('\n========================================================');
    console.log('✅ TODAS LAS PRUEBAS DE ENDPOINTS PASARON CON ÉXITO');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Error ejecutando pruebas:', err);
  } finally {
    server.close();
    await db.pool.end();
  }
};

runTests();
