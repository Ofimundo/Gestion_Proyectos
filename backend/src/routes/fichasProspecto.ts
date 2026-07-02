import express from 'express';
import { body, validationResult } from 'express-validator';
import { FichaProspectoModel } from '../models/FichaProspecto';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// OBTENER TODOS LOS PROSPECTOS
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const prospectos = await FichaProspectoModel.findAll();
        res.json({
            success: true,
            data: prospectos
        });
    } catch (error) {
        console.error('❌ Error al obtener fichas de prospectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener fichas de prospectos'
        });
    }
});

// OBTENER PROSPECTO POR ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const prospecto = await FichaProspectoModel.findById(req.params.id);
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
    } catch (error) {
        console.error('❌ Error al obtener ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ficha de prospecto'
        });
    }
});

// CREAR PROSPECTO
router.post(
    '/',
    authMiddleware,
    [
        body('codigo').notEmpty().withMessage('El código es requerido'),
        body('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
        body('cliente').notEmpty().withMessage('El cliente es requerido'),
        body('estado').notEmpty().withMessage('El estado es requerido')
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

            const prospecto = await FichaProspectoModel.create(req.body);
            res.status(201).json({
                success: true,
                data: prospecto,
                message: 'Ficha de prospecto creada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al crear ficha de prospecto:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear ficha de prospecto'
            });
        }
    }
);

// ACTUALIZAR PROSPECTO
router.put(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const prospecto = await FichaProspectoModel.update(req.params.id, req.body);
            res.json({
                success: true,
                data: prospecto,
                message: 'Ficha de prospecto actualizada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al actualizar ficha de prospecto:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar ficha de prospecto'
            });
        }
    }
);

// ELIMINAR PROSPECTO
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        await FichaProspectoModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ficha de prospecto eliminada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al eliminar ficha de prospecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar ficha de prospecto'
        });
    }
});

export default router;
