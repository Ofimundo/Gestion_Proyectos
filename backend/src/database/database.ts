import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let pool: sql.ConnectionPool | null = null;

const dbConfig: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || 'localhost',
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

export async function getDatabase(): Promise<sql.ConnectionPool> {
    if (pool) return pool;

    try {
        pool = await sql.connect(dbConfig) as any;
        console.log('✅ Conectado a SQL Server - GESTION_PROYECTOS');
        return pool as sql.ConnectionPool;
    } catch (error) {
        console.error('❌ Error conectando a SQL Server:', error);
        throw error;
    }
}

export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('🔌 Conexión a SQL Server cerrada');
    }
}

export async function initializeDatabase() {
    try {
        const db = await getDatabase();
        console.log('✅ Base de datos SQL Server conectada y verificada.');
        
        // Crear columna Horario si no existe
        await db.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('Profesionales') AND name = 'Horario'
            )
            ALTER TABLE Profesionales ADD Horario NVarChar(Max);
        `);
        console.log('✅ Estructura de tabla Profesionales verificada.');

        // Crear tabla FichasProspecto si no existe
        await db.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FichasProspecto')
            BEGIN
                CREATE TABLE FichasProspecto (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Codigo NVARCHAR(50) NOT NULL,
                    NombreProyecto NVARCHAR(255) NOT NULL,
                    Estado NVARCHAR(50) NOT NULL,
                    Cliente NVARCHAR(255) NOT NULL,
                    GestorComercial NVARCHAR(255) NULL,
                    CentroCosto NVARCHAR(100) NULL,
                    FechaEstimadaAdjudicacion DATE NULL,
                    FechaAdjudicacion DATE NULL,
                    ValorServicio DECIMAL(18, 2) NULL,
                    Margen DECIMAL(5, 2) NULL,
                    Rentabilidad DECIMAL(18, 2) NULL,
                    PlazoEstimado NVARCHAR(100) NULL,
                    LineaServicio NVARCHAR(100) NULL,
                    FechaInicio DATE NULL,
                    FechaTermino DATE NULL,
                    Garantia NVARCHAR(255) NULL,
                    HorasSoporte INT NULL,
                    TotalIngresos DECIMAL(18, 2) NULL,
                    Estimaciones NVARCHAR(MAX) NULL,
                    TipoCliente NVARCHAR(50) NULL,
                    FechaCreacion DATETIME DEFAULT GETDATE(),
                    FechaActualizacion DATETIME NULL
                );
            END
        `);

        // Crear columna TipoCliente si no existe (para bases de datos ya existentes)
        await db.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('FichasProspecto') AND name = 'TipoCliente'
            )
            ALTER TABLE FichasProspecto ADD TipoCliente NVARCHAR(50) NULL;
        `);
        console.log('✅ Estructura de tabla FichasProspecto verificada.');
    } catch (error: any) {
        console.warn('⚠️  Error al inicializar la base de datos SQL Server:', error.message);
    }
}

// ============================================
// FUNCIONES DE UTILIDAD PARA CONSULTAS
// ============================================

export async function executeQuery(query: string, params: { [key: string]: any } = {}): Promise<any> {
    const db = await getDatabase();
    const request = db.request();
    
    Object.keys(params).forEach(key => {
        request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
}

export async function executeStoredProcedure(procedureName: string, params: { [key: string]: any } = {}): Promise<any> {
    const db = await getDatabase();
    const request = db.request();
    
    Object.keys(params).forEach(key => {
        request.input(key, params[key]);
    });
    
    const result = await request.execute(procedureName);
    return result;
}

export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// MANEJO DE CIERRE DE CONEXIÓN
// ============================================

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
    closeDatabase,
    initializeDatabase,
    executeQuery,
    executeStoredProcedure,
    generateId
};