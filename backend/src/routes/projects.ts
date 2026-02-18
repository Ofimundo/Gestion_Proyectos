import express from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectModel } from '../models/Project';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// Obtener todos los proyectos
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projects = await ProjectModel.findAll();
    res.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
});

// Obtener estadísticas
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await ProjectModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Obtener un proyecto por ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ message: 'Error al obtener proyecto' });
  }
});

// Obtener proyecto por código
router.get('/code/:code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const project = await ProjectModel.getByCode(req.params.code);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto por código:', error);
    res.status(500).json({ message: 'Error al obtener proyecto por código' });
  }
});

// Crear proyecto
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('client').notEmpty().withMessage('El cliente es requerido'),
    body('leader').notEmpty().withMessage('El líder es requerido')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si ya existe un proyecto con el mismo nombre (opcional)
      const existingProjects = await ProjectModel.search(req.body.name);
      const exactMatch = existingProjects.find(p => 
        p.name.toLowerCase() === req.body.name.toLowerCase()
      );
      
      if (exactMatch) {
        return res.status(400).json({ 
          message: 'Ya existe un proyecto con este nombre' 
        });
      }

      const project = await ProjectModel.create(req.body);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear proyecto';
      res.status(500).json({ message: errorMessage });
    }
  }
);

// Actualizar proyecto
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Verificar si el proyecto existe
    const existingProject = await ProjectModel.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
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
          message: 'Ya existe otro proyecto con este nombre' 
        });
      }
    }

    const project = await ProjectModel.update(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto';
    res.status(500).json({ message: errorMessage });
  }
});

// Eliminar proyecto
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Verificar si el proyecto existe
    const existingProject = await ProjectModel.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    await ProjectModel.delete(req.params.id);
    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar proyecto';
    res.status(500).json({ message: errorMessage });
  }
});

// Buscar proyectos
router.get('/search/:term', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projects = await ProjectModel.search(req.params.term);
    res.json(projects);
  } catch (error) {
    console.error('Error al buscar proyectos:', error);
    res.status(500).json({ message: 'Error al buscar proyectos' });
  }
});

// Obtener proyectos por líder
router.get('/leader/:leaderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Esta es una funcionalidad adicional que podrías implementar
    // Por ahora, obtenemos todos y filtramos
    const allProjects = await ProjectModel.findAll();
    const leaderProjects = allProjects.filter(p => 
      p.leader.toLowerCase().includes(req.params.leaderId.toLowerCase())
    );
    res.json(leaderProjects);
  } catch (error) {
    console.error('Error al obtener proyectos del líder:', error);
    res.status(500).json({ message: 'Error al obtener proyectos del líder' });
  }
});

// Obtener proyectos por estado
router.get('/status/:status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const allProjects = await ProjectModel.findAll();
    const statusProjects = allProjects.filter(p => 
      p.status?.toLowerCase() === req.params.status.toLowerCase()
    );
    res.json(statusProjects);
  } catch (error) {
    console.error('Error al obtener proyectos por estado:', error);
    res.status(500).json({ message: 'Error al obtener proyectos por estado' });
  }
});

export default router;