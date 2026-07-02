"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// src/routes/index.ts
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const projects_1 = __importDefault(require("./projects"));
const professionals_1 = __importDefault(require("./professionals"));
const fichas_1 = __importDefault(require("./fichas"));
const fichasProspecto_1 = __importDefault(require("./fichasProspecto"));
const solicitudes_1 = __importDefault(require("./solicitudes"));
const asignaciones_1 = __importDefault(require("./asignaciones"));
const email_1 = __importDefault(require("./email"));
const router = (0, express_1.Router)();
exports.router = router;
console.log('📋 Registrando rutas...');
// ============================================
// REGISTRO DE RUTAS
// ============================================
// Autenticación - DEBE ESTAR PRIMERO
router.use('/auth', auth_1.default);
console.log('   ✅ /auth registrada');
// Proyectos
router.use('/projects', projects_1.default);
console.log('   ✅ /projects registrada');
// Profesionales (mapear ambos en español e inglés por compatibilidad)
router.use('/professionals', professionals_1.default);
router.use('/profesionales', professionals_1.default);
console.log('   ✅ /professionals y /profesionales registradas');
// Fichas
router.use('/fichas', fichas_1.default);
console.log('   ✅ /fichas registrada');
// Fichas de Prospectos
router.use('/fichas-prospecto', fichasProspecto_1.default);
console.log('   ✅ /fichas-prospecto registrada');
// Solicitudes
router.use('/solicitudes', solicitudes_1.default);
console.log('   ✅ /solicitudes registrada');
// Asignaciones
router.use('/asignaciones', asignaciones_1.default);
console.log('   ✅ /asignaciones registrada');
// Enrutador de correos (Graph API)
router.use('/', email_1.default);
console.log('   ✅ /email registrada');
// Ruta de diagnóstico general
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API RPA Manager funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'SQL Server',
        rutas: [
            '/auth/login',
            '/auth/register',
            '/auth/me',
            '/auth/users',
            '/auth/check-username',
            '/auth/reset-password-by-username',
            '/projects',
            '/profesionales',
            '/fichas',
            '/solicitudes',
            '/asignaciones'
        ]
    });
});
//# sourceMappingURL=index.js.map