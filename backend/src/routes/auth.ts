import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // <-- IMPORTAR bcrypt
import { UserModel } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/database';
import type { Request, Response } from 'express'; // <-- IMPORTAR TIPOS

const router = express.Router();

// Registro
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req: Request, res: Response) => { // <-- AGREGAR TIPOS
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      // Crear usuario
      const user = await UserModel.create({ name, email, password });

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Eliminar password del objeto user
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
        message: 'Usuario registrado exitosamente'
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ message: 'Error al registrar usuario' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  async (req: Request, res: Response) => { // <-- AGREGAR TIPOS
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Validar contraseña
      const isValid = await UserModel.validatePassword(user, password);
      if (!isValid) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Eliminar password del objeto user
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Error al iniciar sesión' });
    }
  }
);

// Solicitar recuperación de contraseña
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email inválido')],
  async (req: Request, res: Response) => { // <-- AGREGAR TIPOS
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const db = await getDatabase();

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.json({ 
          message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña' 
        });
      }

      // Generar token de recuperación
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

      await db.run(
        `INSERT INTO password_resets (id, user_id, token, expires_at)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), user.id, resetToken, expiresAt.toISOString()]
      );

      // En producción, enviar email aquí
      console.log(`Token de recuperación para ${email}: ${resetToken}`);

      res.json({
        message: 'Se han enviado instrucciones a tu correo electrónico'
      });
    } catch (error) {
      console.error('Error en forgot-password:', error);
      res.status(500).json({ message: 'Error al procesar solicitud' });
    }
  }
);

// Resetear contraseña
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password)
  ],
  async (req: Request, res: Response) => { // <-- AGREGAR TIPOS
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      const db = await getDatabase();

      // Buscar token
      const reset = await db.get(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
        [token]
      );

      if (!reset) {
        return res.status(400).json({ message: 'Token inválido o expirado' });
      }

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        'UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?',
        [hashedPassword, reset.user_id]
      );

      // Marcar token como usado
      await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en reset-password:', error);
      res.status(500).json({ message: 'Error al resetear contraseña' });
    }
  }
);

// Obtener usuario actual
router.get('/me', authMiddleware, async (req: Request, res: Response) => { // <-- AGREGAR TIPOS
  try {
    const user = await UserModel.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

export default router;