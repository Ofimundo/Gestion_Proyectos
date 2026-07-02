"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const FichaProspecto_1 = require("../models/FichaProspecto");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// OBTENER TODOS LOS PROSPECTOS
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const prospectos = await FichaProspecto_1.FichaProspectoModel.findAll();
        res.json({
            success: true,
            data: prospectos
        });
    }
    catch (error) {
        console.error('❌ Error al obtener fichas de prospectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener fichas de prospectos'
        });
    }
});
// OBTENER PROSPECTO POR ID
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const prospecto = await FichaProspecto_1.FichaProspectoModel.findById(req.params.id);
        if (!prospecto) {
            return res.status(404).json({
                success: false,
                message: 'Ficha de prospecto no encontrada'
            });
        }
        res.json({
            success: true,
            data: prospecto
        });
    }
    catch (error) {
        console.error('❌ Error al obtener ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ficha de prospecto'
        });
    }
});
// CREAR PROSPECTO
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('codigo').notEmpty().withMessage('El código es requerido'),
    (0, express_validator_1.body)('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
    (0, express_validator_1.body)('cliente').notEmpty().withMessage('El cliente es requerido'),
    (0, express_validator_1.body)('estado').notEmpty().withMessage('El estado es requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const prospecto = await FichaProspecto_1.FichaProspectoModel.create(req.body);
        res.status(201).json({
            success: true,
            data: prospecto,
            message: 'Ficha de prospecto creada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al crear ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear ficha de prospecto'
        });
    }
});
// ACTUALIZAR PROSPECTO
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const prospecto = await FichaProspecto_1.FichaProspectoModel.update(req.params.id, req.body);
        res.json({
            success: true,
            data: prospecto,
            message: 'Ficha de prospecto actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al actualizar ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar ficha de prospecto'
        });
    }
});
// ELIMINAR PROSPECTO
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await FichaProspecto_1.FichaProspectoModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ficha de prospecto eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar ficha de prospecto'
        });
    }
});
exports.default = router;
//# sourceMappingURL=fichasProspecto.js.map