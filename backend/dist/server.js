"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database/database");
const auth_1 = __importDefault(require("./routes/auth"));
const professionals_1 = __importDefault(require("./routes/professionals"));
const projects_1 = __importDefault(require("./routes/projects"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
// Health check - AGREGAR ESTO ANTES DE LAS OTRAS RUTAS
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando correctamente'
    });
});
// Rutas
app.use('/api/auth', auth_1.default);
app.use('/api/professionals', professionals_1.default);
app.use('/api/projects', projects_1.default);
// Inicializar base de datos
(0, database_1.initializeDatabase)().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
});
