const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando compilación multiplataforma...');

try {
  // 1. Instalar dependencias del frontend
  console.log('📦 Instalando dependencias en la carpeta frontend...');
  execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

  // 2. Compilar frontend
  console.log('🚀 Compilando frontend...');
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

  // 3. Mover salida a la raíz /dist
  console.log('📂 Moviendo carpeta de compilación a la raíz...');
  const srcDist = path.join(__dirname, 'frontend', 'dist');
  const destDist = path.join(__dirname, 'dist');

  if (fs.existsSync(destDist)) {
    fs.rmSync(destDist, { recursive: true, force: true });
  }

  fs.cpSync(srcDist, destDist, { recursive: true });
  fs.rmSync(srcDist, { recursive: true, force: true });

  console.log('✅ ¡Compilación completada exitosamente!');
} catch (error) {
  console.log('❌ Error durante la compilación:', error.message);
  if (error.stack) console.log(error.stack);
  process.exit(1);
}
