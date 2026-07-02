"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
// src/config/database.ts
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let pool = null;
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
console.log('📡 Configuración de conexión a SQL Server:');
console.log(`   Servidor: ${dbConfig.server}`);
console.log(`   Base de datos: ${dbConfig.database}`);
console.log(`   Usuario: ${dbConfig.user}`);
console.log(`   Puerto: ${dbConfig.port}`);
async function getDatabase() {
    if (pool) {
        return pool;
    }
    try {
        pool = await mssql_1.default.connect(dbConfig);
        console.log('✅ Conectado a SQL Server exitosamente');
        // Verificar que la base de datos existe
        await verificarBaseDatos(pool);
        return pool;
    }
    catch (error) {
        console.error('❌ Error conectando a SQL Server:', error);
        throw error;
    }
}
async function verificarBaseDatos(db) {
    try {
        // Verificar si la tabla Usuarios existe
        const result = await db.request().query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
            SELECT 1 as Existe
            ELSE
            SELECT 0 as Existe
        `);
        if (result.recordset[0]?.Existe === 0) {
            console.log('⚠️ La tabla Usuarios no existe. Ejecuta el script de creación de tablas.');
        }
        else {
            console.log('✅ Tablas verificadas correctamente');
        }
    }
    catch (error) {
        console.warn('⚠️ Error verificando tablas:', error);
    }
}
async function closeDatabase() {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('🔌 Conexión a SQL Server cerrada');
    }
}
// Manejo de cierre
process.on('SIGINT', async () => {
    console.log('\n🔌 Cerrando conexiones...');
    await closeDatabase();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🔌 Cerrando conexiones...');
    await closeDatabase();
    process.exit(0);
});
exports.default = {
    getDatabase,
    closeDatabase
};
//# sourceMappingURL=database.js.map