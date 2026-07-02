import express from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectModel } from '../models/Project';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// ============================================
// OBTENER TODOS LOS PROYECTOS
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const projects = await ProjectModel.findAll();
        res.json({
            success: true,
            data: projects,
            count: projects.length
        });
    } catch (error) {
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
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
        const stats = await ProjectModel.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
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
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);
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
    } catch (error) {
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
router.get('/code/:code', authMiddleware, async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.getByCode(req.params.code);
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
    } catch (error) {
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
router.get('/:id/summary', authMiddleware, async (req: Request, res: Response) => {
    try {
        const summary = await ProjectModel.getProjectSummary(req.params.id);
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
    } catch (error) {
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
router.get('/:id/resources', authMiddleware, async (req: Request, res: Response) => {
    try {
        const resources = await ProjectModel.getProjectResources(req.params.id);
        res.json({
            success: true,
            data: resources,
            count: resources.length
        });
    } catch (error) {
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
router.post(
    '/',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('El nombre es requerido'),
        body('client').notEmpty().withMessage('El cliente es requerido'),
        body('leader').notEmpty().withMessage('El líder es requerido'),
        body('description').optional(),
        body('technologies').optional(),
        body('commercialManager').optional(),
        body('saleAmount').optional().isNumeric().withMessage('El monto debe ser numérico'),
        body('hhImplementation').optional().isNumeric().withMessage('HH implementación debe ser numérico'),
        body('hhPeriod').optional().isNumeric().withMessage('HH período debe ser numérico'),
        body('startDate').optional(),
        body('endDate').optional(),
        body('clientContact').optional(),
        body('stages').optional().isArray().withMessage('Stages debe ser un array'),
        body('risks').optional().isArray().withMessage('Risks debe ser un array'),
        body('resources').optional().isArray().withMessage('Resources debe ser un array')
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

            // Verificar si ya existe un proyecto con el mismo nombre
            const existingProjects = await ProjectModel.search(req.body.name);
            const exactMatch = existingProjects.find(p =>
                p.name.toLowerCase() === req.body.name.toLowerCase()
            );

            if (exactMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un proyecto con este nombre'
                });
            }

            const project = await ProjectModel.create(req.body);
            res.status(201).json({
                success: true,
                data: project,
                message: 'Proyecto creado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al crear proyecto:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al crear proyecto';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }
);

// ============================================
// ACTUALIZAR PROYECTO
// ============================================
router.put(
    '/:id',
    authMiddleware,
    [
        body('name').optional().notEmpty().withMessage('El nombre es requerido'),
        body('client').optional().notEmpty().withMessage('El cliente es requerido'),
        body('leader').optional().notEmpty().withMessage('El líder es requerido'),
        body('description').optional(),
        body('technologies').optional(),
        body('commercialManager').optional(),
        body('saleAmount').optional().isNumeric().withMessage('El monto debe ser numérico'),
        body('hhImplementation').optional().isNumeric().withMessage('HH implementación debe ser numérico'),
        body('hhPeriod').optional().isNumeric().withMessage('HH período debe ser numérico'),
        body('startDate').optional(),
        body('endDate').optional(),
        body('clientContact').optional(),
        body('stages').optional().isArray().withMessage('Stages debe ser un array'),
        body('risks').optional().isArray().withMessage('Risks debe ser un array'),
        body('resources').optional().isArray().withMessage('Resources debe ser un array')
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

            // Verificar si el proyecto existe
            const existingProject = await ProjectModel.findById(req.params.id);
            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado'
                });
            }

            // Si se está actualizando el nombre, verificar que no esté en uso
            if (req.body.name && req.body.name !== existingProject.name) {
                const projects = await ProjectModel.search(req.body.name);
                const nameExists = projects.some(p =>
                    p.id !== req.params.id &&
                    p.name.toLowerCase() === req.body.name.toLowerCase()
                );

                if (nameExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otro proyecto con este nombre'
                    });
                }
            }

            const project = await ProjectModel.update(req.params.id, req.body);
            res.json({
                success: true,
                data: project,
                message: 'Proyecto actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al actualizar proyecto:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto';
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }
);

// ============================================
// ACTUALIZAR ESTADO DEL PROYECTO
// ============================================
router.patch(
    '/:id/status',
    authMiddleware,
    [
        body('status').notEmpty().withMessage('El estado es requerido')
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

            const { status } = req.body;

            // Verificar si el proyecto existe
            const existingProject = await ProjectModel.findById(req.params.id);
            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado'
                });
            }

            await ProjectModel.updateStatus(req.params.id, status);
            res.json({
                success: true,
                message: 'Estado del proyecto actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al actualizar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado del proyecto'
            });
        }
    }
);

// ============================================
// ELIMINAR PROYECTO
// ============================================
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        // Verificar si el proyecto existe
        const existingProject = await ProjectModel.findById(req.params.id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        await ProjectModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
        });
    } catch (error) {
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
router.get('/search/:term', authMiddleware, async (req: Request, res: Response) => {
    try {
        const projects = await ProjectModel.search(req.params.term);
        res.json({
            success: true,
            data: projects,
            count: projects.length
        });
    } catch (error) {
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
router.get('/leader/:leaderId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const allProjects = await ProjectModel.findAll();
        const leaderProjects = allProjects.filter(p =>
            p.leader.toLowerCase().includes(req.params.leaderId.toLowerCase())
        );
        res.json({
            success: true,
            data: leaderProjects,
            count: leaderProjects.length
        });
    } catch (error) {
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
router.get('/status/:status', authMiddleware, async (req: Request, res: Response) => {
    try {
        const allProjects = await ProjectModel.findAll();
        const statusProjects = allProjects.filter(p =>
            p.status?.toLowerCase() === req.params.status.toLowerCase()
        );
        res.json({
            success: true,
            data: statusProjects,
            count: statusProjects.length
        });
    } catch (error) {
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
router.get('/client/:clientName', authMiddleware, async (req: Request, res: Response) => {
    try {
        const allProjects = await ProjectModel.findAll();
        const clientProjects = allProjects.filter(p =>
            p.client.toLowerCase().includes(req.params.clientName.toLowerCase())
        );
        res.json({
            success: true,
            data: clientProjects,
            count: clientProjects.length
        });
    } catch (error) {
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
router.get('/top/hh', authMiddleware, async (req: Request, res: Response) => {
    try {
        const allProjects = await ProjectModel.findAll();
        const sorted = allProjects
            .sort((a, b) => (b.hh_implementation || 0) - (a.hh_implementation || 0))
            .slice(0, 10);
        res.json({
            success: true,
            data: sorted,
            count: sorted.length
        });
    } catch (error) {
        console.error('❌ Error al obtener proyectos top HH:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyectos con mayor HH'
        });
    }
});

export default router;