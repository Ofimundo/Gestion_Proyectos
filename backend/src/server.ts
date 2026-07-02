import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/database';
import { router as apiRouter } from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Registrar enrutador de la API
app.use('/api', apiRouter);

// Ruta base/saludo
app.get('/', (req, res) => {
    res.json({
        message: 'Servidor API del RPA Project Manager activo',
        status: 'online'
    });
});

const PORT = process.env.PORT || 3001;

// Inicializar la base de datos y arrancar el servidor
initializeDatabase()
    .then(() => {
        console.log('🗄️  Base de datos SQL Server conectada e inicializada');
    })
    .catch((error: any) => {
        console.error('⚠️  Error al inicializar la base de datos SQL Server:', error.message || error);
        console.warn('📌 El servidor iniciará, pero las funciones de base de datos no estarán disponibles hasta que se resuelva la conexión.');
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 ========================================`);
            console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
            console.log(`========================================\n`);
        });
    });

// Manejo de apagado limpio
process.on('SIGINT', async () => {
    console.log('\n🔌 Apagando servidor...');
    process.exit(0);
});