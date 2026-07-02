import express from 'express';
import { body, validationResult } from 'express-validator';
import { FichaModel } from '../models/Ficha';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// ============================================
// OBTENER TODAS LAS FICHAS
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const fichas = await FichaModel.findAll();
        res.json({
            success: true,
            data: fichas
        });
    } catch (error) {
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
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const ficha = await FichaModel.findById(req.params.id);
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
    } catch (error) {
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
router.post(
    '/',
    authMiddleware,
    [
        body('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
        body('cliente').notEmpty().withMessage('El cliente es requerido'),
        body('lider').notEmpty().withMessage('El líder es requerido')
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

            const ficha = await FichaModel.create(req.body);
            res.status(201).json({
                success: true,
                data: ficha,
                message: 'Ficha creada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al crear ficha:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear ficha'
            });
        }
    }
);

// ============================================
// ACTUALIZAR FICHA
// ============================================
router.put(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const ficha = await FichaModel.update(req.params.id, req.body);
            res.json({
                success: true,
                data: ficha,
                message: 'Ficha actualizada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al actualizar ficha:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar ficha'
            });
        }
    }
);

// ============================================
// ELIMINAR FICHA
// ============================================
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        await FichaModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ficha eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('❌ Error al eliminar ficha:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar ficha'
        });
    }
});

export default router;
