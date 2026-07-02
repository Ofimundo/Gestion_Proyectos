"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
const router = (0, express_1.Router)();
console.log('🔐 Configurando rutas de autenticación...');
// ============================================
// REGISTRO DE USUARIO
// ============================================
router.post('/register', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    (0, express_validator_1.body)('username').optional().isLength({ min: 3 }).withMessage('El username debe tener al menos 3 caracteres')
], async (req, res) => {
    try {
        console.log('📝 Registrando usuario:', req.body.email);
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password, username, empresa } = req.body;
        // Verificar si el usuario ya existe
        const existingUser = await User_1.UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        // Crear usuario
        const user = await User_1.UserModel.create({
            nombre: name,
            email: email,
            password: password,
            username: username || email.split('@')[0],
            empresa: empresa || null
        });
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: user.Id, email: user.Email, role: user.Rol }, process.env.JWT_SECRET || 'tu_secreto_super_secreto', { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
});
// ============================================
// LOGIN
// ============================================
router.post('/login', [
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email o usuario requerido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        console.log('🔐 Intentando login:', req.body.email);
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // Buscar usuario por email o nombre
        const user = await User_1.UserModel.findByEmailOrUsername(email);
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
        const isValid = await bcrypt_1.default.compare(password, user.PasswordHash);
        if (!isValid) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: user.Id, email: user.Email, role: user.Rol }, process.env.JWT_SECRET || 'tu_secreto_super_secreto', { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});
// ============================================
// VERIFICAR SI USUARIO EXISTE
// ============================================
router.post('/check-username', [(0, express_validator_1.body)('username').notEmpty().withMessage('Usuario requerido')], async (req, res) => {
    try {
        const { username } = req.body;
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Username', mssql_1.default.NVarChar, username)
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
    }
    catch (error) {
        console.error('❌ Error en check-username:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar usuario'
        });
    }
});
// ============================================
// RESTABLECER CONTRASEÑA POR USUARIO
// ============================================
router.post('/reset-password-by-username', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Usuario requerido'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Username', mssql_1.default.NVarChar, username)
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
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await db.request()
            .input('Id', mssql_1.default.Int, user.Id)
            .input('PasswordHash', mssql_1.default.NVarChar, hashedPassword)
            .query(`
                    UPDATE Usuarios 
                    SET PasswordHash = @PasswordHash, FechaActualizacion = GETDATE() 
                    WHERE Id = @Id
                `);
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error en reset-password-by-username:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
});
// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_1.UserModel.findById(req.user.id);
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
    }
    catch (error) {
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
router.get('/users', auth_1.authMiddleware, async (req, res) => {
    try {
        const users = await User_1.UserModel.findAll();
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
    }
    catch (error) {
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
router.put('/users/:id/role', auth_1.authMiddleware, [(0, express_validator_1.body)('role').notEmpty().withMessage('El rol es requerido')], async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await User_1.UserModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        await User_1.UserModel.changeRole(parseInt(id), role);
        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error en changeUserRole:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar rol'
        });
    }
});
// ============================================
// ACTIVAR/DESACTIVAR USUARIO (ADMIN)
// ============================================
router.put('/users/:id/toggle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.UserModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        await User_1.UserModel.toggleActive(parseInt(id));
        res.json({
            success: true,
            message: 'Estado del usuario actualizado'
        });
    }
    catch (error) {
        console.error('❌ Error en toggleUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado'
        });
    }
});
// ============================================
// ELIMINAR USUARIO (ADMIN)
// ============================================
router.delete('/users/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        if (parseInt(id) === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }
        const user = await User_1.UserModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        await User_1.UserModel.delete(parseInt(id));
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    }
    catch (error) {
        console.error('❌ Error en deleteUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});
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
exports.default = router;
//# sourceMappingURL=auth.js.map