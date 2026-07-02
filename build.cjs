const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando compilación multiplataforma...');

function copyRecursiveSync(src, dest) {
  try {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    console.log(`❌ Error copying ${src} to ${dest}:`, err.message);
    throw err;
  }
}

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

  copyRecursiveSync(srcDist, destDist);
  fs.rmSync(srcDist, { recursive: true, force: true });

  console.log('✅ ¡Compilación completada exitosamente!');
} catch (error) {
  console.log('❌ Error durante la compilación:', error.message);
  if (error.stack) console.log(error.stack);
  process.exit(1);
}
