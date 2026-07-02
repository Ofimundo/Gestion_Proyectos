"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Professional_1 = require("../models/Professional");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// OBTENER TODOS LOS PROFESIONALES
// ============================================
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.findAll();
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener profesionales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesionales'
        });
    }
});
// ============================================
// OBTENER PROFESIONAL POR ID
// ============================================
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const professional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        res.json({
            success: true,
            data: professional
        });
    }
    catch (error) {
        console.error('❌ Error al obtener profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesional'
        });
    }
});
// ============================================
// CREAR PROFESIONAL
// ============================================
router.post('/', auth_1.authMiddleware, (req, res, next) => {
    if (req.body.nombre && !req.body.name)
        req.body.name = req.body.nombre;
    if (req.body.cargo && !req.body.role)
        req.body.role = req.body.cargo;
    next();
}, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('role').notEmpty().withMessage('El rol es requerido'),
    (0, express_validator_1.body)('department').optional(),
    (0, express_validator_1.body)('phone').optional(),
    (0, express_validator_1.body)('specialties').optional().isArray().withMessage('Specialties debe ser un array')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        // Verificar si ya existe un profesional con ese email
        const existingProfessional = await Professional_1.ProfessionalModel.getByEmail(req.body.email);
        if (existingProfessional) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un profesional con este email'
            });
        }
        const professional = await Professional_1.ProfessionalModel.create(req.body);
        res.status(201).json({
            success: true,
            data: professional,
            message: 'Profesional creado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al crear profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear profesional';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// ACTUALIZAR PROFESIONAL
// ============================================
router.put('/:id', auth_1.authMiddleware, (req, res, next) => {
    if (req.body.nombre && !req.body.name)
        req.body.name = req.body.nombre;
    if (req.body.cargo && !req.body.role)
        req.body.role = req.body.cargo;
    next();
}, [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('role').optional().notEmpty().withMessage('El rol es requerido'),
    (0, express_validator_1.body)('department').optional(),
    (0, express_validator_1.body)('phone').optional(),
    (0, express_validator_1.body)('specialties').optional().isArray().withMessage('Specialties debe ser un array')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        // Verificar si el profesional existe
        const existingProfessional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!existingProfessional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        // Si se está actualizando el email, verificar que no esté en uso por otro profesional
        if (req.body.email && req.body.email !== existingProfessional.email) {
            const professionalWithEmail = await Professional_1.ProfessionalModel.getByEmail(req.body.email);
            if (professionalWithEmail && professionalWithEmail.id !== req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso por otro profesional'
                });
            }
        }
        const professional = await Professional_1.ProfessionalModel.update(req.params.id, req.body);
        res.json({
            success: true,
            data: professional,
            message: 'Profesional actualizado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar profesional';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// ELIMINAR PROFESIONAL
// ============================================
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el profesional existe
        const existingProfessional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!existingProfessional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        await Professional_1.ProfessionalModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Profesional eliminado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar profesional';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// BUSCAR PROFESIONALES
// ============================================
router.get('/search/:term', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.search(req.params.term);
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
    }
    catch (error) {
        console.error('❌ Error al buscar profesionales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar profesionales'
        });
    }
});
// ============================================
// OBTENER PROFESIONALES POR PROYECTO
// ============================================
router.get('/project/:projectId', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.getProjectProfessionals(req.params.projectId);
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener profesionales del proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesionales del proyecto'
        });
    }
});
// ============================================
// OBTENER PROFESIONALES DISPONIBLES
// ============================================
router.get('/available/all', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.getAvailableProfessionals();
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener profesionales disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesionales disponibles'
        });
    }
});
// ============================================
// OBTENER PROFESIONALES POR ESPECIALIDAD
// ============================================
router.get('/specialty/:specialty', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.getProfessionalsBySpecialty(req.params.specialty);
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener profesionales por especialidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesionales por especialidad'
        });
    }
});
// ============================================
// OBTENER PROFESIONALES CON HORAS
// ============================================
router.get('/stats/hours', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.getProfessionalsWithHours();
        res.json({
            success: true,
            data: professionals
        });
    }
    catch (error) {
        console.error('❌ Error al obtener estadísticas de horas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de horas'
        });
    }
});
// ============================================
// ESTADÍSTICAS DE PROFESIONALES
// ============================================
router.get('/stats/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const stats = await Professional_1.ProfessionalModel.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});
// ============================================
// ASIGNAR PROFESIONAL A PROYECTO
// ============================================
router.post('/:id/assign/:projectId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id, projectId } = req.params;
        // Verificar si el profesional existe
        const professional = await Professional_1.ProfessionalModel.findById(id);
        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        await Professional_1.ProfessionalModel.assignToProject(id, projectId);
        res.json({
            success: true,
            message: 'Profesional asignado al proyecto exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al asignar profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asignar profesional al proyecto'
        });
    }
});
// ============================================
// REMOVER PROFESIONAL DE PROYECTO
// ============================================
router.delete('/:id/remove/:projectId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id, projectId } = req.params;
        // Verificar si el profesional existe
        const professional = await Professional_1.ProfessionalModel.findById(id);
        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        await Professional_1.ProfessionalModel.removeFromProject(id, projectId);
        res.json({
            success: true,
            message: 'Profesional removido del proyecto exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al remover profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover profesional del proyecto'
        });
    }
});
// ============================================
// OBTENER PROYECTOS DE UN PROFESIONAL
// ============================================
router.get('/:id/projects', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar si el profesional existe
        const professional = await Professional_1.ProfessionalModel.findById(id);
        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }
        // Obtener proyectos del profesional (usando el método existente)
        const projects = await Professional_1.ProfessionalModel.getProjectProfessionals(id);
        res.json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos del profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos del profesional'
        });
    }
});
exports.default = router;
//# sourceMappingURL=professionals.js.map