import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../database/database';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔐 Intento de login:', email);

      // Buscar usuario por email o username
      const user = await db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, email]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET || 'tu_secreto_super_secreto',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          username: user.username,
          role: user.role
        }
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { nombre, username, email, password, empresa } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email o nombre de usuario ya está registrado'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar nuevo usuario
      const result = await db.run(
        `INSERT INTO users (nombre, username, email, password, empresa, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, username, email, hashedPassword, empresa || null, 'user']
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        userId: result.lastID
      });

    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
};