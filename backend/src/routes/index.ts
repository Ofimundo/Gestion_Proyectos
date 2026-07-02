// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth';
import projectsRoutes from './projects';
import professionalsRoutes from './professionals';
import fichasRoutes from './fichas';
import fichasProspectoRoutes from './fichasProspecto';
import solicitudesRoutes from './solicitudes';
import asignacionesRoutes from './asignaciones';
import emailRoutes from './email';

const router = Router();

console.log('📋 Registrando rutas...');

// ============================================
// REGISTRO DE RUTAS
// ============================================

// Autenticación - DEBE ESTAR PRIMERO
router.use('/auth', authRoutes);
console.log('   ✅ /auth registrada');

// Proyectos
router.use('/projects', projectsRoutes);
console.log('   ✅ /projects registrada');

// Profesionales (mapear ambos en español e inglés por compatibilidad)
router.use('/professionals', professionalsRoutes);
router.use('/profesionales', professionalsRoutes);
console.log('   ✅ /professionals y /profesionales registradas');

// Fichas
router.use('/fichas', fichasRoutes);
console.log('   ✅ /fichas registrada');

// Fichas de Prospectos
router.use('/fichas-prospecto', fichasProspectoRoutes);
console.log('   ✅ /fichas-prospecto registrada');

// Solicitudes
router.use('/solicitudes', solicitudesRoutes);
console.log('   ✅ /solicitudes registrada');

// Asignaciones
router.use('/asignaciones', asignacionesRoutes);
console.log('   ✅ /asignaciones registrada');

// Enrutador de correos (Graph API)
router.use('/', emailRoutes);
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

export { router };