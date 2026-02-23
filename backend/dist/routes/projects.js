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
// Obtener todos los proyectos
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const projects = await Project_1.ProjectModel.findAll();
        res.json(projects);
    }
    catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ message: 'Error al obtener proyectos' });
    }
});
// Obtener estadísticas
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const stats = await Project_1.ProjectModel.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});
// Obtener un proyecto por ID
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const project = await Project_1.ProjectModel.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Error al obtener proyecto:', error);
        res.status(500).json({ message: 'Error al obtener proyecto' });
    }
});
// Obtener proyecto por código
router.get('/code/:code', auth_1.authMiddleware, async (req, res) => {
    try {
        const project = await Project_1.ProjectModel.getByCode(req.params.code);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Error al obtener proyecto por código:', error);
        res.status(500).json({ message: 'Error al obtener proyecto por código' });
    }
});
// Crear proyecto
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('client').notEmpty().withMessage('El cliente es requerido'),
    (0, express_validator_1.body)('leader').notEmpty().withMessage('El líder es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Verificar si ya existe un proyecto con el mismo nombre (opcional)
        const existingProjects = await Project_1.ProjectModel.search(req.body.name);
        const exactMatch = existingProjects.find(p => p.name.toLowerCase() === req.body.name.toLowerCase());
        if (exactMatch) {
            return res.status(400).json({
                message: 'Ya existe un proyecto con este nombre'
            });
        }
        const project = await Project_1.ProjectModel.create(req.body);
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Error al crear proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear proyecto';
        res.status(500).json({ message: errorMessage });
    }
});
// Actualizar proyecto
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el proyecto existe
        const existingProject = await Project_1.ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        // Si se está actualizando el nombre, verificar que no esté en uso
        if (req.body.name && req.body.name !== existingProject.name) {
            const projects = await Project_1.ProjectModel.search(req.body.name);
            const nameExists = projects.some(p => p.id !== req.params.id &&
                p.name.toLowerCase() === req.body.name.toLowerCase());
            if (nameExists) {
                return res.status(400).json({
                    message: 'Ya existe otro proyecto con este nombre'
                });
            }
        }
        const project = await Project_1.ProjectModel.update(req.params.id, req.body);
        res.json(project);
    }
    catch (error) {
        console.error('Error al actualizar proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto';
        res.status(500).json({ message: errorMessage });
    }
});
// Eliminar proyecto
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el proyecto existe
        const existingProject = await Project_1.ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        await Project_1.ProjectModel.delete(req.params.id);
        res.json({ message: 'Proyecto eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar proyecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar proyecto';
        res.status(500).json({ message: errorMessage });
    }
});
// Buscar proyectos
router.get('/search/:term', auth_1.authMiddleware, async (req, res) => {
    try {
        const projects = await Project_1.ProjectModel.search(req.params.term);
        res.json(projects);
    }
    catch (error) {
        console.error('Error al buscar proyectos:', error);
        res.status(500).json({ message: 'Error al buscar proyectos' });
    }
});
// Obtener proyectos por líder
router.get('/leader/:leaderId', auth_1.authMiddleware, async (req, res) => {
    try {
        // Esta es una funcionalidad adicional que podrías implementar
        // Por ahora, obtenemos todos y filtramos
        const allProjects = await Project_1.ProjectModel.findAll();
        const leaderProjects = allProjects.filter(p => p.leader.toLowerCase().includes(req.params.leaderId.toLowerCase()));
        res.json(leaderProjects);
    }
    catch (error) {
        console.error('Error al obtener proyectos del líder:', error);
        res.status(500).json({ message: 'Error al obtener proyectos del líder' });
    }
});
// Obtener proyectos por estado
router.get('/status/:status', auth_1.authMiddleware, async (req, res) => {
    try {
        const allProjects = await Project_1.ProjectModel.findAll();
        const statusProjects = allProjects.filter(p => p.status?.toLowerCase() === req.params.status.toLowerCase());
        res.json(statusProjects);
    }
    catch (error) {
        console.error('Error al obtener proyectos por estado:', error);
        res.status(500).json({ message: 'Error al obtener proyectos por estado' });
    }
});
exports.default = router;
