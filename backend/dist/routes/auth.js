"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt")); // <-- IMPORTAR bcrypt
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const database_1 = require("../database/database");
const router = express_1.default.Router();
// Registro
router.post('/register', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('El nombre es requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password } = req.body;
        // Verificar si el usuario ya existe
        const existingUser = await User_1.UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        // Crear usuario
        const user = await User_1.UserModel.create({ name, email, password });
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        // Eliminar password del objeto user
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token,
            message: 'Usuario registrado exitosamente'
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});
// Login
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // Buscar usuario
        const user = await User_1.UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Validar contraseña
        const isValid = await User_1.UserModel.validatePassword(user, password);
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Generar token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        // Eliminar password del objeto user
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});
// Solicitar recuperación de contraseña
router.post('/forgot-password', [(0, express_validator_1.body)('email').isEmail().withMessage('Email inválido')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email } = req.body;
        const db = await (0, database_1.getDatabase)();
        const user = await User_1.UserModel.findByEmail(email);
        if (!user) {
            return res.json({
                message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña'
            });
        }
        // Generar token de recuperación
        const resetToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora
        await db.run(`INSERT INTO password_resets (id, user_id, token, expires_at)
         VALUES (?, ?, ?, ?)`, [(0, uuid_1.v4)(), user.id, resetToken, expiresAt.toISOString()]);
        // En producción, enviar email aquí
        console.log(`Token de recuperación para ${email}: ${resetToken}`);
        res.json({
            message: 'Se han enviado instrucciones a tu correo electrónico'
        });
    }
    catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({ message: 'Error al procesar solicitud' });
    }
});
// Resetear contraseña
router.post('/reset-password', [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Token requerido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    (0, express_validator_1.body)('confirmPassword').custom((value, { req }) => value === req.body.password)
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { token, password } = req.body;
        const db = await (0, database_1.getDatabase)();
        // Buscar token
        const reset = await db.get('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")', [token]);
        if (!reset) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }
        // Actualizar contraseña
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db.run('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?', [hashedPassword, reset.user_id]);
        // Marcar token como usado
        await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);
        res.json({ message: 'Contraseña actualizada exitosamente' });
    }
    catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({ message: 'Error al resetear contraseña' });
    }
});
// Obtener usuario actual
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_1.UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
});
exports.default = router;
