import express from 'express';
import { body, validationResult } from 'express-validator';
import { ProfessionalModel } from '../models/Professional';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';

const router = express.Router();

// Obtener todos los profesionales
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const professionals = await ProfessionalModel.findAll();
    res.json(professionals);
  } catch (error) {
    console.error('Error al obtener profesionales:', error);
    res.status(500).json({ message: 'Error al obtener profesionales' });
  }
});

// Obtener un profesional por ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const professional = await ProfessionalModel.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }
    res.json(professional);
  } catch (error) {
    console.error('Error al obtener profesional:', error);
    res.status(500).json({ message: 'Error al obtener profesional' });
  }
});

// Crear profesional
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('role').notEmpty().withMessage('El rol es requerido')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si ya existe un profesional con ese email
      const existingProfessional = await ProfessionalModel.getByEmail(req.body.email);
      if (existingProfessional) {
        return res.status(400).json({ message: 'Ya existe un profesional con este email' });
      }

      const professional = await ProfessionalModel.create(req.body);
      res.status(201).json(professional);
    } catch (error) {
      console.error('Error al crear profesional:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear profesional';
      res.status(500).json({ message: errorMessage });
    }
  }
);

// Actualizar profesional
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Verificar si el profesional existe
    const existingProfessional = await ProfessionalModel.findById(req.params.id);
    if (!existingProfessional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }

    // Si se está actualizando el email, verificar que no esté en uso por otro profesional
    if (req.body.email && req.body.email !== existingProfessional.email) {
      const professionalWithEmail = await ProfessionalModel.getByEmail(req.body.email);
      if (professionalWithEmail && professionalWithEmail.id !== req.params.id) {
        return res.status(400).json({ message: 'El email ya está en uso por otro profesional' });
      }
    }

    const professional = await ProfessionalModel.update(req.params.id, req.body);
    res.json(professional);
  } catch (error) {
    console.error('Error al actualizar profesional:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar profesional';
    res.status(500).json({ message: errorMessage });
  }
});

// Eliminar profesional
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Verificar si el profesional existe
    const existingProfessional = await ProfessionalModel.findById(req.params.id);
    if (!existingProfessional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }

    await ProfessionalModel.delete(req.params.id);
    res.json({ message: 'Profesional eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar profesional:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar profesional';
    res.status(500).json({ message: errorMessage });
  }
});

// Buscar profesionales
router.get('/search/:term', authMiddleware, async (req: Request, res: Response) => {
  try {
    const professionals = await ProfessionalModel.search(req.params.term);
    res.json(professionals);
  } catch (error) {
    console.error('Error al buscar profesionales:', error);
    res.status(500).json({ message: 'Error al buscar profesionales' });
  }
});

// Obtener profesionales por proyecto
router.get('/project/:projectId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const professionals = await ProfessionalModel.getProjectProfessionals(req.params.projectId);
    res.json(professionals);
  } catch (error) {
    console.error('Error al obtener profesionales del proyecto:', error);
    res.status(500).json({ message: 'Error al obtener profesionales del proyecto' });
  }
});

export default router;