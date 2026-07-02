// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

interface JwtPayload {
  id: number;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto') as JwtPayload;
    req.user = decoded;

    // Verificar si el usuario existe y está activo
    try {
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'No autorizado - Usuario no encontrado'
        });
        return;
      }

      if (!user.Activo) {
        res.status(401).json({
          success: false,
          message: 'No autorizado - Usuario inactivo'
        });
        return;
      }
    } catch (dbError) {
      console.warn('⚠️ No se pudo verificar usuario en BD:', dbError);
    }

    next();
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);
    res.status(401).json({
      success: false,
      message: 'No autorizado - Token inválido o expirado'
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'No autorizado - Usuario no autenticado'
        });
        return;
      }

      if (!user.role || !allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: 'Acceso denegado - No tienes permisos suficientes'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Error en roleMiddleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto') as JwtPayload;
        req.user = decoded;
      } catch (error) {
        console.warn('⚠️ Token inválido en optionalAuth');
      }
    }

    next();
  } catch (error) {
    next();
  }
};