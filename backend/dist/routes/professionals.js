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
// Obtener todos los profesionales
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.findAll();
        res.json(professionals);
    }
    catch (error) {
        console.error('Error al obtener profesionales:', error);
        res.status(500).json({ message: 'Error al obtener profesionales' });
    }
});
// Obtener un profesional por ID
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const professional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!professional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        res.json(professional);
    }
    catch (error) {
        console.error('Error al obtener profesional:', error);
        res.status(500).json({ message: 'Error al obtener profesional' });
    }
});
// Crear profesional
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('role').notEmpty().withMessage('El rol es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Verificar si ya existe un profesional con ese email
        const existingProfessional = await Professional_1.ProfessionalModel.getByEmail(req.body.email);
        if (existingProfessional) {
            return res.status(400).json({ message: 'Ya existe un profesional con este email' });
        }
        const professional = await Professional_1.ProfessionalModel.create(req.body);
        res.status(201).json(professional);
    }
    catch (error) {
        console.error('Error al crear profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear profesional';
        res.status(500).json({ message: errorMessage });
    }
});
// Actualizar profesional
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el profesional existe
        const existingProfessional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!existingProfessional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        // Si se está actualizando el email, verificar que no esté en uso por otro profesional
        if (req.body.email && req.body.email !== existingProfessional.email) {
            const professionalWithEmail = await Professional_1.ProfessionalModel.getByEmail(req.body.email);
            if (professionalWithEmail && professionalWithEmail.id !== req.params.id) {
                return res.status(400).json({ message: 'El email ya está en uso por otro profesional' });
            }
        }
        const professional = await Professional_1.ProfessionalModel.update(req.params.id, req.body);
        res.json(professional);
    }
    catch (error) {
        console.error('Error al actualizar profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar profesional';
        res.status(500).json({ message: errorMessage });
    }
});
// Eliminar profesional
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verificar si el profesional existe
        const existingProfessional = await Professional_1.ProfessionalModel.findById(req.params.id);
        if (!existingProfessional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        await Professional_1.ProfessionalModel.delete(req.params.id);
        res.json({ message: 'Profesional eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar profesional:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar profesional';
        res.status(500).json({ message: errorMessage });
    }
});
// Buscar profesionales
router.get('/search/:term', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.search(req.params.term);
        res.json(professionals);
    }
    catch (error) {
        console.error('Error al buscar profesionales:', error);
        res.status(500).json({ message: 'Error al buscar profesionales' });
    }
});
// Obtener profesionales por proyecto
router.get('/project/:projectId', auth_1.authMiddleware, async (req, res) => {
    try {
        const professionals = await Professional_1.ProfessionalModel.getProjectProfessionals(req.params.projectId);
        res.json(professionals);
    }
    catch (error) {
        console.error('Error al obtener profesionales del proyecto:', error);
        res.status(500).json({ message: 'Error al obtener profesionales del proyecto' });
    }
});
exports.default = router;
