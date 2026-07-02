"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Ficha_1 = require("../models/Ficha");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// OBTENER TODAS LAS FICHAS
// ============================================
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const fichas = await Ficha_1.FichaModel.findAll();
        res.json({
            success: true,
            data: fichas
        });
    }
    catch (error) {
        console.error('❌ Error al obtener fichas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener fichas'
        });
    }
});
// ============================================
// OBTENER FICHA POR ID
// ============================================
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const ficha = await Ficha_1.FichaModel.findById(req.params.id);
        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha no encontrada'
            });
        }
        res.json({
            success: true,
            data: ficha
        });
    }
    catch (error) {
        console.error('❌ Error al obtener ficha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ficha'
        });
    }
});
// ============================================
// CREAR FICHA
// ============================================
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
    (0, express_validator_1.body)('cliente').notEmpty().withMessage('El cliente es requerido'),
    (0, express_validator_1.body)('lider').notEmpty().withMessage('El líder es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const ficha = await Ficha_1.FichaModel.create(req.body);
        res.status(201).json({
            success: true,
            data: ficha,
            message: 'Ficha creada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al crear ficha:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear ficha'
        });
    }
});
// ============================================
// ACTUALIZAR FICHA
// ============================================
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const ficha = await Ficha_1.FichaModel.update(req.params.id, req.body);
        res.json({
            success: true,
            data: ficha,
            message: 'Ficha actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar ficha:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar ficha'
        });
    }
});
// ============================================
// ELIMINAR FICHA
// ============================================
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await Ficha_1.FichaModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ficha eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar ficha:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar ficha'
        });
    }
});
exports.default = router;
//# sourceMappingURL=fichas.js.map