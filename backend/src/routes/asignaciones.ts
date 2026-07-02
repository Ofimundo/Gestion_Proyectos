import express from 'express';
import { body, validationResult } from 'express-validator';
import { AsignacionModel } from '../models/Asignacion';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// ============================================
// CREAR/ACTUALIZAR ASIGNACIÓN
// ============================================
router.post(
    '/',
    authMiddleware,
    [
        body('solicitudId').notEmpty().withMessage('El ID de la solicitud es requerido'),
        body('profesionalId').notEmpty().withMessage('El ID del profesional es requerido'),
        body('estimacionHoras').isNumeric().withMessage('La estimación de horas debe ser numérica')
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { solicitudId, profesionalId, estimacionHoras, fechaInicioEstimada, fechaFinEstimada } = req.body;

            await AsignacionModel.assign({
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
        } catch (error: any) {
            console.error('❌ Error al asignar recurso:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al registrar asignación'
            });
        }
    }
);

// ============================================
// ELIMINAR ASIGNACIÓN
// ============================================
router.delete('/:profesionalId/:solicitudId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { profesionalId, solicitudId } = req.params;
        await AsignacionModel.remove(profesionalId, solicitudId);
        res.json({
            success: true,
            message: 'Asignación eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('❌ Error al eliminar asignación:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar asignación'
        });
    }
});

export default router;
