# LISTADO COMPLETO Y EXHAUSTIVO DE LIBRERÍAS DEL PROYECTO (DIRECTAS E INDIRECTAS)

**Proyecto:** OFILAB / RPA Manager - Gestión de Proyectos  
**Fecha de actualización:** 2026-10-01  

Este documento contiene la totalidad de las librerías utilizadas en el proyecto, tanto las **DEPENDENCIAS DIRECTAS** (declaradas en `package.json`) como las **DEPENDENCIAS TRANSITIVAS / SUB-LIBRERÍAS** (instaladas en `node_modules` como `electron-to-chromium`, `esbuild`, `jszip`, `tedious`, etc.).

---

## PARTE 1: DEPENDENCIAS DIRECTAS (PACKAGE.JSON)

### 1.1 BACKEND (`./backend/package.json`)

#### Dependencias de Producción (`dependencies`):
1. **`@azure/identity`** (`^4.13.1`): Autenticación OAuth2 / Azure AD.
2. **`@microsoft/microsoft-graph-client`** (`^3.0.7`): Cliente de Microsoft Graph API.
3. **`bcrypt`** (`^5.1.1`): Hashing nativo de contraseñas.
4. **`bcryptjs`** (`^3.0.3`): Hashing de contraseñas en JS puro.
5. **`body-parser`** (`^2.2.2`): Middleware para extracción de JSON y URL-encoded en peticiones HTTP.
6. **`cors`** (`^2.8.6`): Middleware para política de Cross-Origin Resource Sharing.
7. **`dotenv`** (`^16.6.1`): Carga de variables de entorno desde `.env`.
8. **`express`** (`^4.22.2`): Framework HTTP para la API REST.
9. **`express-validator`** (`^7.3.1`): Validación y sanitización de datos de entrada.
10. **`jsonwebtoken`** (`^9.0.3`): Creación y firma de tokens JWT.
11. **`mssql`** (`^9.0.0`): Cliente oficial de Microsoft SQL Server.
12. **`nodemailer`** (`^8.0.1`): Procesamiento y envío de emails.
13. **`uuid`** (`^13.0.2`): Generación de identificadores únicos universales (UUID v4).

#### Dependencias de Desarrollo (`devDependencies`):
- `@types/bcrypt`, `@types/bcryptjs`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/mssql`, `@types/node`, `@types/nodemailer`, `@types/uuid`
- `nodemon` (`^3.1.11`): Monitor de reinicio automático del servidor.
- `ts-node` (`^10.9.2`): Ejecutor TS para Node.js.
- `typescript` (`^5.9.3`): Compilador de TypeScript.

---

### 1.2 FRONTEND (`./frontend/package.json`)

#### Dependencias de Producción (`dependencies`):
1. **`axios`** (`^1.13.5`): Cliente HTTP para peticiones al backend.
2. **`chart.js`** (`^4.5.1`): Motor de gráficos e indicadores en HTML5 Canvas.
3. **`exceljs`** (`^4.4.0`): Generación y manipulación avanzada de archivos Excel (`.xlsx`).
4. **`react`** (`^19.2.0`): Librería principal de construcción de interfaces UI.
5. **`react-chartjs-2`** (`^5.3.1`): Integración de Chart.js con componentes React.
6. **`react-dom`** (`^19.2.0`): Renderizador de React para el DOM del navegador.
7. **`react-hot-toast`** (`^2.6.0`): Sistema de alertas emergentes (Toasts).
8. **`react-router-dom`** (`^6.30.3`): Enrutamiento y navegación SPA.
9. **`xlsx`** (`^0.18.5`): Exportación/Importación de datos Excel (SheetJS).

#### Dependencias de Desarrollo (`devDependencies`):
- `@eslint/js`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`
- `autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `postcss`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`

---

## PARTE 2: DEPENDENCIAS TRANSITIVAS, INTERNAS Y DE INFRAESTRUCTURA (NODE_MODULES)

*(Librerías secundarias, compiladores, drivers internos y herramientas de renderizado/compatibilidad instaladas en el sistema)*

- **`electron-to-chromium`**: Mapeo de versiones de Electron a Chromium para compatibilidad de compilación y navegadores (usado internamente por Browserslist / Autoprefixer / Vite).
- **`esbuild`**: Compilador ultra rápido de JavaScript/TypeScript basado en Go (utilizado internamente por Vite).
- **`jszip`**: Generador y descompresor de archivos ZIP en JavaScript (utilizado internamente por ExcelJS).
- **`tedious`**: Driver nativo en JS puro para protocolo TDS de SQL Server (utilizado internamente por mssql).
- **`tarn`**: Pool de conexiones de base de datos SQL (utilizado internamente por mssql / knex).
- **`zod` & `zod-validation-error`**: Librería de declaración y validación de esquemas TypeScript.
- **`archiver` & `zip-stream`**: Generación de archivos comprimidos y streams de datos.
- **`fast-csv`**: Parsing y generación acelerada de archivos CSV (usado por ExcelJS).
- **`browserslist`**: Mapeo de navegadores compatibles y targets de CSS/JS (usado por Autoprefixer).
- **`caniuse-lite`**: Base de datos ligera de compatibilidad de APIs web en navegadores.
- **`chokidar`**: Vigilante de cambios en el sistema de archivos en tiempo real (usado por Vite y Nodemon).
- **`dayjs`**: Librería de manipulación y parseo de fechas y horas.
- **`follow-redirects`**: Manejo automático de redirecciones HTTP/HTTPS en Node.js.
- **`form-data`**: Construcción de peticiones multipart/form-data (usado por Axios).
- **`goober`**: Micro-librería CSS-in-JS (usada por react-hot-toast).
- **`iconv-lite`**: Conversión de codificaciones de texto (UTF-8, ISO-8859-1, Windows-1252, etc.).
- **`jwa` & `jws`**: Algoritmos de firma digital JSON Web Algorithms / Signature (usados por jsonwebtoken).
- **`lodash`**: Utilidades generales de manipulación de arrays, objetos y colecciones.
- **`nanoid`**: Generador de IDs únicos compacto y seguro.
- **`pako`**: Compresión y descompresión rápida zlib / deflate.
- **`picocolors` & `chalk`**: Formateado de colores en consola de comandos.
- **`react-refresh` & `react-router`**: Motores internos de recarga rápida y ruteo base de React.
- **`rollup`**: Bundler de JavaScript para empaquetado de producción en Vite.
- **`saxes` & `xmlchars`**: Parsers ligeros de documentos XML (usados por ExcelJS y SheetJS).
- **`ssf`, `cfb`, `codepage`, `adler-32`, `crc-32`, `frac`**: Módulos matemáticos y de formato de archivos binarios de Excel (usados por XLSX / SheetJS).
- **`stoppable`**: Manejo de apagado limpio (graceful shutdown) de servidores HTTP.
- **`tinyglobby` & `fast-glob`**: Coincidencia rápida de patrones de archivos (globs).
- **`validator`**: Validadores de cadenas de texto (usado por express-validator).
- **`whatwg-url` & `tr46`**: Parsers de URLs conformes al estándar WHATWG.
