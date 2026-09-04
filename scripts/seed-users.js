/**
 * Script para asegurar que los usuarios semilla tengan hashes bcrypt válidos
 * Proyecto: NutriScan - Calidad 4.0
 */

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

async function seedUsers() {
  console.log('🔄 Actualizando contraseñas de prueba con bcrypt...');
  const passwordPlano = '123456';
  const saltRounds = 10;
  const hash = await bcrypt.hash(passwordPlano, saltRounds);

  console.log(`🔐 Hash bcrypt generado para '${passwordPlano}': ${hash}`);

  const updateResult = await prisma.usuarios.updateMany({
    data: {
      password_hash: hash,
      activo: true
    }
  });

  console.log(`✅ Usuarios actualizados: ${updateResult.count}`);

  const usuarios = await prisma.usuarios.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      password_hash: true
    }
  });

  for (const user of usuarios) {
    const isValid = await bcrypt.compare(passwordPlano, user.password_hash);
    console.log(`👤 [${user.rol}] ${user.email} -> Contraseña '123456' válida: ${isValid}`);
  }

  await prisma.$disconnect();
}

seedUsers().catch(err => {
  console.error('❌ Error al actualizar contraseñas:', err);
  process.exit(1);
});
