"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Asignacion_1 = require("../models/Asignacion");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================
// CREAR/ACTUALIZAR ASIGNACIÓN
// ============================================
router.post('/', auth_1.authMiddleware, [
    (0, express_validator_1.body)('solicitudId').notEmpty().withMessage('El ID de la solicitud es requerido'),
    (0, express_validator_1.body)('profesionalId').notEmpty().withMessage('El ID del profesional es requerido'),
    (0, express_validator_1.body)('estimacionHoras').isNumeric().withMessage('La estimación de horas debe ser numérica')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { solicitudId, profesionalId, estimacionHoras, fechaInicioEstimada, fechaFinEstimada } = req.body;
        await Asignacion_1.AsignacionModel.assign({
            solicitudId,
            profesionalId,
            estimacionHoras: Number(estimacionHoras),
            fechaInicioEstimada: fechaInicioEstimada || '',
            fechaFinEstimada: fechaFinEstimada || ''
        });
        res.json({
            success: true,
            message: 'Asignación de recurso registrada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al asignar recurso:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al registrar asignación'
        });
    }
});
// ============================================
// ELIMINAR ASIGNACIÓN
// ============================================
router.delete('/:profesionalId/:solicitudId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { profesionalId, solicitudId } = req.params;
        await Asignacion_1.AsignacionModel.remove(profesionalId, solicitudId);
        res.json({
            success: true,
            message: 'Asignación eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error al eliminar asignación:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar asignación'
        });
    }
});
exports.default = router;
//# sourceMappingURL=asignaciones.js.map