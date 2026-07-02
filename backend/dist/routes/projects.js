"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Project_1 = require("../models/Project");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// OBTENER TODOS LOS PROYECTOS
// ============================================
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const projects = await Project_1.ProjectModel.findAll();
        res.json({
            success: true,
            data: projects,
            count: projects.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos'
        });
    }
});
// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const stats = await Project_1.ProjectModel.getStats();
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
// OBTENER PROYECTO POR ID
// ============================================
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const project = await Project_1.ProjectModel.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyecto'
        });
    }
});
// ============================================
// OBTENER PROYECTO POR CÓDIGO
// ============================================
router.get('/code/:code', auth_1.authMiddleware, async (req, res) => {
    try {
        const project = await Project_1.ProjectModel.getByCode(req.params.code);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyecto por código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyecto por código'
        });
    }
});
// ============================================
// OBTENER RESUMEN DEL PROYECTO
// ============================================
router.get('/:id/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const summary = await Project_1.ProjectModel.getProjectSummary(req.params.id);
        if (!summary) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('❌ Error al obtener resumen del proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del proyecto'
        });
    }
});
// ============================================
// OBTENER RECURSOS DEL PROYECTO
// ============================================
router.get('/:id/resources', auth_1.authMiddleware, async (req, res) => {
    try {
        const resources = await Project_1.ProjectModel.getProjectResources(req.params.id);
        res.json({
            success: true,
            data: resources,
            count: resources.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener recursos del proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recursos del proyecto'
        });
    }
});
// ============================================
// CREAR PROYECTO
// ============================================
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('client').notEmpty().withMessage('El cliente es requerido'),
    (0, express_validator_1.body)('leader').notEmpty().withMessage('El líder es requerido'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('technologies').optional(),
    (0, express_validator_1.body)('commercialManager').optional(),
    (0, express_validator_1.body)('saleAmount').optional().isNumeric().withMessage('El monto debe ser numérico'),
    (0, express_validator_1.body)('hhImplementation').optional().isNumeric().withMessage('HH implementación debe ser numérico'),
    (0, express_validator_1.body)('hhPeriod').optional().isNumeric().withMessage('HH período debe ser numérico'),
    (0, express_validator_1.body)('startDate').optional(),
    (0, express_validator_1.body)('endDate').optional(),
    (0, express_validator_1.body)('clientContact').optional(),
    (0, express_validator_1.body)('stages').optional().isArray().withMessage('Stages debe ser un array'),
    (0, express_validator_1.body)('risks').optional().isArray().withMessage('Risks debe ser un array'),
    (0, express_validator_1.body)('resources').optional().isArray().withMessage('Resources debe ser un array')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        // Verificar si ya existe un proyecto con el mismo nombre
        const existingProjects = await Project_1.ProjectModel.search(req.body.name);
        const exactMatch = existingProjects.find(p => p.name.toLowerCase() === req.body.name.toLowerCase());
        if (exactMatch) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un proyecto con este nombre'
            });
        }
        const project = await Project_1.ProjectModel.create(req.body);
        res.status(201).json({
            success: true,
            data: project,
            message: 'Proyecto creado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al crear proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear proyecto';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// ACTUALIZAR PROYECTO
// ============================================
router.put('/:id', auth_1.authMiddleware, [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('client').optional().notEmpty().withMessage('El cliente es requerido'),
    (0, express_validator_1.body)('leader').optional().notEmpty().withMessage('El líder es requerido'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('technologies').optional(),
    (0, express_validator_1.body)('commercialManager').optional(),
    (0, express_validator_1.body)('saleAmount').optional().isNumeric().withMessage('El monto debe ser numérico'),
    (0, express_validator_1.body)('hhImplementation').optional().isNumeric().withMessage('HH implementación debe ser numérico'),
    (0, express_validator_1.body)('hhPeriod').optional().isNumeric().withMessage('HH período debe ser numérico'),
    (0, express_validator_1.body)('startDate').optional(),
    (0, express_validator_1.body)('endDate').optional(),
    (0, express_validator_1.body)('clientContact').optional(),
    (0, express_validator_1.body)('stages').optional().isArray().withMessage('Stages debe ser un array'),
    (0, express_validator_1.body)('risks').optional().isArray().withMessage('Risks debe ser un array'),
    (0, express_validator_1.body)('resources').optional().isArray().withMessage('Resources debe ser un array')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        // Verificar si el proyecto existe
        const existingProject = await Project_1.ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        // Si se está actualizando el nombre, verificar que no esté en uso
        if (req.body.name && req.body.name !== existingProject.name) {
            const projects = await Project_1.ProjectModel.search(req.body.name);
            const nameExists = projects.some(p => p.id !== req.params.id &&
                p.name.toLowerCase() === req.body.name.toLowerCase());
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro proyecto con este nombre'
                });
            }
        }
        const project = await Project_1.ProjectModel.update(req.params.id, req.body);
        res.json({
            success: true,
            data: project,
            message: 'Proyecto actualizado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// ACTUALIZAR ESTADO DEL PROYECTO
// ============================================
router.patch('/:id/status', auth_1.authMiddleware, [
    (0, express_validator_1.body)('status').notEmpty().withMessage('El estado es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { status } = req.body;
        // Verificar si el proyecto existe
        const existingProject = await Project_1.ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        await Project_1.ProjectModel.updateStatus(req.params.id, status);
        res.json({
            success: true,
            message: 'Estado del proyecto actualizado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del proyecto'
        });
    }
});
// ============================================
// ELIMINAR PROYECTO
// ============================================
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el proyecto existe
        const existingProject = await Project_1.ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        await Project_1.ProjectModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar proyecto';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// BUSCAR PROYECTOS
// ============================================
router.get('/search/:term', auth_1.authMiddleware, async (req, res) => {
    try {
        const projects = await Project_1.ProjectModel.search(req.params.term);
        res.json({
            success: true,
            data: projects,
            count: projects.length
        });
    }
    catch (error) {
        console.error('❌ Error al buscar proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar proyectos'
        });
    }
});
// ============================================
// OBTENER PROYECTOS POR LÍDER
// ============================================
router.get('/leader/:leaderId', auth_1.authMiddleware, async (req, res) => {
    try {
        const allProjects = await Project_1.ProjectModel.findAll();
        const leaderProjects = allProjects.filter(p => p.leader.toLowerCase().includes(req.params.leaderId.toLowerCase()));
        res.json({
            success: true,
            data: leaderProjects,
            count: leaderProjects.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos del líder:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos del líder'
        });
    }
});
// ============================================
// OBTENER PROYECTOS POR ESTADO
// ============================================
router.get('/status/:status', auth_1.authMiddleware, async (req, res) => {
    try {
        const allProjects = await Project_1.ProjectModel.findAll();
        const statusProjects = allProjects.filter(p => p.status?.toLowerCase() === req.params.status.toLowerCase());
        res.json({
            success: true,
            data: statusProjects,
            count: statusProjects.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos por estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos por estado'
        });
    }
});
// ============================================
// OBTENER PROYECTOS POR CLIENTE
// ============================================
router.get('/client/:clientName', auth_1.authMiddleware, async (req, res) => {
    try {
        const allProjects = await Project_1.ProjectModel.findAll();
        const clientProjects = allProjects.filter(p => p.client.toLowerCase().includes(req.params.clientName.toLowerCase()));
        res.json({
            success: true,
            data: clientProjects,
            count: clientProjects.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos por cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos por cliente'
        });
    }
});
// ============================================
// OBTENER PROYECTOS CON MAYOR HH
// ============================================
router.get('/top/hh', auth_1.authMiddleware, async (req, res) => {
    try {
        const allProjects = await Project_1.ProjectModel.findAll();
        const sorted = allProjects
            .sort((a, b) => (b.hh_implementation || 0) - (a.hh_implementation || 0))
            .slice(0, 10);
        res.json({
            success: true,
            data: sorted,
            count: sorted.length
        });
    }
    catch (error) {
        console.error('❌ Error al obtener proyectos top HH:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos con mayor HH'
        });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map