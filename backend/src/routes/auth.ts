// src/routes/auth.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database';
import sql from 'mssql';
import type { Request, Response } from 'express';

const router = Router();

console.log('🔐 Configurando rutas de autenticación...');

// ============================================
// REGISTRO DE USUARIO
// ============================================
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('username').optional().isLength({ min: 3 }).withMessage('El username debe tener al menos 3 caracteres')
    ],
    async (req: Request, res: Response) => {
        try {
            console.log('📝 Registrando usuario:', req.body.email);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password, username, empresa } = req.body;

            // Verificar si el usuario ya existe
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Crear usuario
            const user = await UserModel.create({
                nombre: name,
                email: email,
                password: password,
                username: username || email.split('@')[0],
                empresa: empresa || null
            });

            // Generar token
            const token = jwt.sign(
                { id: user.Id, email: user.Email, role: user.Rol },
                process.env.JWT_SECRET || 'tu_secreto_super_secreto',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                user: {
                    id: user.Id,
                    nombre: user.Nombre,
                    email: user.Email,
                    role: user.Rol
                },
                token,
                message: 'Usuario registrado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar usuario'
            });
        }
    }
);

// ============================================
// LOGIN
// ============================================
router.post(
    '/login',
    [
        body('email').notEmpty().withMessage('Email o usuario requerido'),
        body('password').notEmpty().withMessage('La contraseña es requerida')
    ],
    async (req: Request, res: Response) => {
        try {
            console.log('🔐 Intentando login:', req.body.email);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Buscar usuario por email o nombre
            const user = await UserModel.findByEmailOrUsername(email);
            if (!user) {
                console.log('❌ Usuario no encontrado:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar si el usuario está activo
            if (user.Activo === false) {
                console.log('❌ Usuario inactivo:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo. Contacta al administrador.'
                });
            }

            // Validar contraseña
            const isValid = await bcrypt.compare(password, user.PasswordHash);
            if (!isValid) {
                console.log('❌ Contraseña incorrecta para:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar token
            const token = jwt.sign(
                { id: user.Id, email: user.Email, role: user.Rol },
                process.env.JWT_SECRET || 'tu_secreto_super_secreto',
                { expiresIn: '24h' }
            );

            console.log('✅ Login exitoso para:', email);

            res.json({
                success: true,
                user: {
                    id: user.Id,
                    nombre: user.Nombre,
                    email: user.Email,
                    role: user.Rol
                },
                token,
                message: 'Login exitoso'
            });
        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión'
            });
        }
    }
);

// ============================================
// VERIFICAR SI USUARIO EXISTE
// ============================================
router.post(
    '/check-username',
    [body('username').notEmpty().withMessage('Usuario requerido')],
    async (req: Request, res: Response) => {
        try {
            const { username } = req.body;
            const db = await getDatabase();

            const result = await db.request()
                .input('Username', sql.NVarChar, username)
                .query(`
                    SELECT * FROM Usuarios 
                    WHERE Nombre = @Username 
                    OR Email = @Username
                `);

            const user = result.recordset[0];

            res.json({
                success: true,
                exists: !!user,
                nombre: user?.Nombre || null
            });
        } catch (error) {
            console.error('❌ Error en check-username:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar usuario'
            });
        }
    }
);

// ============================================
// RESTABLECER CONTRASEÑA POR USUARIO
// ============================================
router.post(
    '/reset-password-by-username',
    [
        body('username').notEmpty().withMessage('Usuario requerido'),
        body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    async (req: Request, res: Response) => {
        try {
            const { username, newPassword } = req.body;
            const db = await getDatabase();

            const result = await db.request()
                .input('Username', sql.NVarChar, username)
                .query(`
                    SELECT * FROM Usuarios 
                    WHERE Nombre = @Username 
                    OR Email = @Username
                `);

            const user = result.recordset[0];

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.request()
                .input('Id', sql.Int, user.Id)
                .input('PasswordHash', sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE Usuarios 
                    SET PasswordHash = @PasswordHash, FechaActualizacion = GETDATE() 
                    WHERE Id = @Id
                `);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en reset-password-by-username:', error);
            res.status(500).json({
                success: false,
                message: 'Error al restablecer la contraseña'
            });
        }
    }
);

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findById((req as any).user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.Id,
                nombre: user.Nombre,
                email: user.Email,
                role: user.Rol,
                activo: user.Activo
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
});

// ============================================
// OBTENER TODOS LOS USUARIOS (ADMIN)
// ============================================
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
    try {
        const users = await UserModel.findAll();
        res.json({
            success: true,
            users: users.map(u => ({
                id: u.Id,
                name: u.Nombre,
                email: u.Email,
                role: u.Rol,
                activo: u.Activo
            }))
        });
    } catch (error) {
        console.error('❌ Error en getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// ============================================
// CAMBIAR ROL DE USUARIO (ADMIN)
// ============================================
router.put(
    '/users/:id/role',
    authMiddleware,
    [body('role').notEmpty().withMessage('El rol es requerido')],
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            const user = await UserModel.findById(parseInt(id));
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            await UserModel.changeRole(parseInt(id), role);

            res.json({
                success: true,
                message: 'Rol actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en changeUserRole:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar rol'
            });
        }
    }
);

// ============================================
// ACTIVAR/DESACTIVAR USUARIO (ADMIN)
// ============================================
router.put(
    '/users/:id/toggle',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const user = await UserModel.findById(parseInt(id));
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            await UserModel.toggleActive(parseInt(id));

            res.json({
                success: true,
                message: 'Estado del usuario actualizado'
            });
        } catch (error) {
            console.error('❌ Error en toggleUser:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado'
            });
        }
    }
);

// ============================================
// ELIMINAR USUARIO (ADMIN)
// ============================================
router.delete(
    '/users/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const currentUserId = (req as any).user.id;

            if (parseInt(id) === currentUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propio usuario'
                });
            }

            const user = await UserModel.findById(parseInt(id));
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            await UserModel.delete(parseInt(id));

            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en deleteUser:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
    }
);

console.log('✅ Rutas de autenticación configuradas:');
console.log('   POST /auth/register');
console.log('   POST /auth/login');
console.log('   POST /auth/check-username');
console.log('   POST /auth/reset-password-by-username');
console.log('   GET  /auth/me');
console.log('   GET  /auth/users');
console.log('   PUT  /auth/users/:id/role');
console.log('   PUT  /auth/users/:id/toggle');
console.log('   DELETE /auth/users/:id');

export default router;