import { Router, Request, Response } from 'express';
import GestionDemandaModel from '../models/GestionDemanda';
import FichaProspectoModel from '../models/FichaProspecto';

const router = Router();

// GET /api/demanda - Obtener todas las demandas
router.get('/', async (req: Request, res: Response) => {
    try {
        // Sincronizar todos los prospectos existentes a gestión de la demanda
        try {
            await FichaProspectoModel.syncAllToDemanda();
        } catch (syncErr) {
            console.error('Error al autosincronizar prospectos en GET /api/demanda:', syncErr);
        }

        const demandas = await GestionDemandaModel.findAll();
        res.json({
            success: true,
            data: demandas
        });
    } catch (error: any) {
        console.error('Error al obtener la gestión de demanda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener registros de demanda',
            error: error.message
        });
    }
});

// GET /api/demanda/:id - Obtener una demanda por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const demanda = await GestionDemandaModel.findById(req.params.id);
        if (!demanda) {
            return res.status(404).json({
                success: false,
                message: 'Registro de demanda no encontrado'
            });
        }
        res.json({
            success: true,
            data: demanda
        });
    } catch (error: any) {
        console.error('Error al obtener la demanda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la demanda',
            error: error.message
        });
    }
});

// POST /api/demanda - Crear nueva demanda
router.post('/', async (req: Request, res: Response) => {
    try {
        const nuevaDemanda = await GestionDemandaModel.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Registro de demanda creado exitosamente',
            data: nuevaDemanda
        });
    } catch (error: any) {
        console.error('Error al crear demanda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el registro de demanda',
            error: error.message
        });
    }
});

// PUT /api/demanda/:id - Actualizar demanda completa
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const actualizada = await GestionDemandaModel.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Registro de demanda actualizado exitosamente',
            data: actualizada
        });
    } catch (error: any) {
        console.error('Error al actualizar demanda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el registro de demanda',
            error: error.message
        });
    }
});

// PATCH /api/demanda/:id/prioridad - Cambio rápido de prioridad
router.patch('/:id/prioridad', async (req: Request, res: Response) => {
    try {
        const { prioridad } = req.body;
        if (!prioridad) {
            return res.status(400).json({
                success: false,
                message: 'El campo prioridad es requerido'
            });
        }
        const actualizada = await GestionDemandaModel.updatePrioridad(req.params.id, prioridad);
        res.json({
            success: true,
            message: 'Prioridad actualizada exitosamente',
            data: actualizada
        });
    } catch (error: any) {
        console.error('Error al actualizar prioridad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la prioridad',
            error: error.message
        });
    }
});

// PATCH /api/demanda/:id/estado - Cambio rápido de estado
router.patch('/:id/estado', async (req: Request, res: Response) => {
    try {
        const { estado } = req.body;
        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'El campo estado es requerido'
            });
        }
        const actualizada = await GestionDemandaModel.updateEstado(req.params.id, estado);
        res.json({
            success: true,
            message: 'Estado actualizado exitosamente',
            data: actualizada
        });
    } catch (error: any) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
    }
});

// DELETE /api/demanda/:id - Eliminar demanda
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await GestionDemandaModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Registro de demanda eliminado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar demanda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el registro de demanda',
            error: error.message
        });
    }
});

export default router;
