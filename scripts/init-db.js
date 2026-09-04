/**
 * Script de Inicialización y Ejecución de DDL (Creación de tablas) / Seeds (Datos de prueba) en Neon PostgreSQL
 * Proyecto: NutriScan - Calidad 4.0
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const initDatabase = async () => {
  console.log('========================================================');
  console.log('📦 Inicializando Esquema DDL en Neon Cloud (schema.sql)');
  console.log('========================================================');

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf-8');

    console.log(`📄 Leyendo archivo: ${schemaPath}`);
    console.log('⏳ Ejecutando sentencias SQL en Neon PostgreSQL...');

    await db.query(sqlContent);

    console.log('✅ Esquema DDL y semillas ejecutados exitosamente.');

    // Verificación de conteo de registros en las tablas creadas
    console.log('\n🔍 Verificando datos iniciales en tablas maestras:');

    const usuariosRes = await db.query('SELECT COUNT(*) AS total FROM usuarios');
    console.log(`   👥 Usuarios registrados:       ${usuariosRes.rows[0].total}`);

    const defectosRes = await db.query('SELECT COUNT(*) AS total FROM tipos_defecto');
    console.log(`   🏷️  Tipos de defecto cargados:  ${defectosRes.rows[0].total}`);

    const lotesRes = await db.query('SELECT COUNT(*) AS total FROM lotes');
    console.log(`   📦 Lotes de prueba:            ${lotesRes.rows[0].total}`);

    const inspeccionesRes = await db.query('SELECT COUNT(*) AS total FROM inspecciones');
    console.log(`   🔬 Inspecciones de muestra:    ${inspeccionesRes.rows[0].total}`);

    const alertasRes = await db.query('SELECT COUNT(*) AS total FROM alertas');
    console.log(`   🚨 Alertas iniciales:          ${alertasRes.rows[0].total}`);

    console.log('========================================================');
    console.log('✨ Base de datos lista y validada para NutriScan.');
    console.log('========================================================');
  } catch (error) {
    console.error('❌ Error fatal al inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

initDatabase();
