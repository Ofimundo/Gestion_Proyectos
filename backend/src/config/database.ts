// src/config/database.ts
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let pool: sql.ConnectionPool | null = null;

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

export async function getDatabase(): Promise<sql.ConnectionPool> {
    if (pool) {
        return pool;
    }

    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ Conectado a SQL Server exitosamente');
        
        // Verificar que la base de datos existe
        await verificarBaseDatos(pool);
        
        return pool;
    } catch (error) {
        console.error('❌ Error conectando a SQL Server:', error);
        throw error;
    }
}

async function verificarBaseDatos(db: sql.ConnectionPool) {
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
        } else {
            console.log('✅ Tablas verificadas correctamente');
        }
    } catch (error) {
        console.warn('⚠️ Error verificando tablas:', error);
    }
}

export async function closeDatabase(): Promise<void> {
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

export default {
    getDatabase,
    closeDatabase
};