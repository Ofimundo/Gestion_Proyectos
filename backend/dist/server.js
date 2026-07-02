"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database/database");
const routes_1 = require("./routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Registrar enrutador de la API
app.use('/api', routes_1.router);
// Ruta base/saludo
app.get('/', (req, res) => {
    res.json({
        message: 'Servidor API del RPA Project Manager activo',
        status: 'online'
    });
});
const PORT = process.env.PORT || 3001;
// Inicializar la base de datos y arrancar el servidor
(0, database_1.initializeDatabase)()
    .then(() => {
    console.log('🗄️  Base de datos SQL Server conectada e inicializada');
})
    .catch((error) => {
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
//# sourceMappingURL=server.js.map