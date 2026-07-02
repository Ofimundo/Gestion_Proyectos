"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Solicitud_1 = require("../models/Solicitud");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// OBTENER TODAS LAS SOLICITUDES (Protegido)
// ============================================
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        console.log('📋 Obteniendo todas las solicitudes...');
        const solicitudes = await Solicitud_1.SolicitudModel.findAll();
        console.log(`✅ ${solicitudes.length} solicitudes encontradas`);
        res.json({
            success: true,
            data: solicitudes
        });
    }
    catch (error) {
        console.error('❌ Error al obtener solicitudes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes'
        });
    }
});
// ============================================
// OBTENER SOLICITUD POR TOKEN (Público)
// ============================================
router.get('/token/:token', async (req, res) => {
    try {
        console.log(`🔍 Buscando solicitud con token: ${req.params.token}`);
        const solicitud = await Solicitud_1.SolicitudModel.findByToken(req.params.token);
        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Enlace inválido o solicitud no encontrada'
            });
        }
        console.log('✅ Solicitud encontrada por token:', solicitud.id);
        res.json({
            success: true,
            data: solicitud
        });
    }
    catch (error) {
        console.error('❌ Error al obtener solicitud por token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitud'
        });
    }
});
// ============================================
// OBTENER SOLICITUD POR ID (Protegido)
// ============================================
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        console.log(`🔍 Buscando solicitud con ID: ${req.params.id}`);
        const solicitud = await Solicitud_1.SolicitudModel.findById(req.params.id);
        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        console.log('✅ Solicitud encontrada por ID:', solicitud.id);
        res.json({
            success: true,
            data: solicitud
        });
    }
    catch (error) {
        console.error('❌ Error al obtener solicitud por ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitud'
        });
    }
});
// ============================================
// CREAR SOLICITUD (Protegido)
// ============================================
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
    (0, express_validator_1.body)('nombreSolicitante').notEmpty().withMessage('El nombre del solicitante es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        console.log('📝 Creando nueva solicitud...');
        const solicitud = await Solicitud_1.SolicitudModel.create(req.body);
        console.log('✅ Solicitud creada:', solicitud.id);
        res.status(201).json({
            success: true,
            data: solicitud,
            message: 'Solicitud creada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al crear solicitud:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear solicitud'
        });
    }
});
// ============================================
// ACTUALIZAR SOLICITUD (Público para completar formulario externo)
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body;
        console.log(`📝 Actualizando solicitud ${id}...`);
        console.log('📤 Datos recibidos:', JSON.stringify(datos, null, 2));
        const solicitudActualizada = await Solicitud_1.SolicitudModel.update(id, datos);
        if (!solicitudActualizada) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        console.log('✅ Solicitud actualizada:', solicitudActualizada.id);
        console.log('📥 Datos actualizados:', JSON.stringify(solicitudActualizada, null, 2));
        res.json({
            success: true,
            data: solicitudActualizada,
            message: 'Solicitud actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar solicitud:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar solicitud'
        });
    }
});
// ============================================
// ELIMINAR SOLICITUD (Protegido)
// ============================================
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        console.log(`🗑️ Eliminando solicitud ${req.params.id}...`);
        await Solicitud_1.SolicitudModel.delete(req.params.id);
        console.log('✅ Solicitud eliminada:', req.params.id);
        res.json({
            success: true,
            message: 'Solicitud eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar solicitud:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar solicitud'
        });
    }
});
// ============================================
// APROBAR SOLICITUD (Protegido)
// ✅ CORREGIDO: Usar undefined en lugar de null
// ============================================
router.post('/:id/aprobar', auth_1.authMiddleware, [
    (0, express_validator_1.body)('completadoPor').optional().isString().withMessage('completadoPor debe ser texto')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { completadoPor, observaciones } = req.body;
        console.log(`✅ Aprobando solicitud ${id}...`);
        console.log(`📝 Completado por: ${completadoPor || 'admin'}`);
        console.log(`📝 Observaciones: ${observaciones || 'Sin observaciones'}`);
        // Buscar la solicitud primero para verificar que existe
        const solicitudExistente = await Solicitud_1.SolicitudModel.findById(id);
        if (!solicitudExistente) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        // ✅ CORREGIDO: Usar undefined en lugar de null
        // Actualizar estado a Aprobado
        const solicitudAprobada = await Solicitud_1.SolicitudModel.update(id, {
            estado: 'Aprobado',
            completadoPor: completadoPor || 'admin',
            fechaAprobacionRechazo: new Date().toISOString(),
            observacionesAdmin: observaciones || '', // ✅ Usar string vacío en lugar de null
            // ✅ No incluir motivoRechazo para limpiarlo, o usar undefined
            motivoRechazo: undefined // ✅ O simplemente no incluir esta propiedad
        });
        console.log('✅ Solicitud aprobada:', solicitudAprobada.id);
        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            data: solicitudAprobada
        });
    }
    catch (error) {
        console.error('❌ Error al aprobar solicitud:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al aprobar la solicitud'
        });
    }
});
// ============================================
// RECHAZAR SOLICITUD (Protegido)
// ✅ CORREGIDO: Usar undefined en lugar de null
// ============================================
router.post('/:id/rechazar', auth_1.authMiddleware, [
    (0, express_validator_1.body)('motivoRechazo').notEmpty().withMessage('El motivo de rechazo es requerido'),
    (0, express_validator_1.body)('completadoPor').optional().isString().withMessage('completadoPor debe ser texto')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { motivoRechazo, completadoPor } = req.body;
        console.log(`❌ Rechazando solicitud ${id}...`);
        console.log(`📝 Motivo: ${motivoRechazo}`);
        console.log(`📝 Completado por: ${completadoPor || 'admin'}`);
        // Buscar la solicitud primero para verificar que existe
        const solicitudExistente = await Solicitud_1.SolicitudModel.findById(id);
        if (!solicitudExistente) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        // ✅ CORREGIDO: Usar undefined en lugar de null
        // Actualizar estado a Rechazado
        const solicitudRechazada = await Solicitud_1.SolicitudModel.update(id, {
            estado: 'Rechazado',
            motivoRechazo: motivoRechazo,
            completadoPor: completadoPor || 'admin',
            fechaAprobacionRechazo: new Date().toISOString(),
            // ✅ No incluir observacionesAdmin para limpiarlo, o usar undefined
            observacionesAdmin: undefined // ✅ O simplemente no incluir esta propiedad
        });
        console.log('✅ Solicitud rechazada:', solicitudRechazada.id);
        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente',
            data: solicitudRechazada
        });
    }
    catch (error) {
        console.error('❌ Error al rechazar solicitud:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al rechazar la solicitud'
        });
    }
});
exports.default = router;
//# sourceMappingURL=solicitudes.js.map