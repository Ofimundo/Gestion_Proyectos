"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../database/database");
exports.authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const db = await (0, database_1.getDatabase)();
            console.log('🔐 Intento de login:', email);
            // Buscar usuario por email o username
            const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            // Verificar contraseña
            const validPassword = await bcrypt_1.default.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            // Generar token JWT
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }, process.env.JWT_SECRET || 'tu_secreto_super_secreto', { expiresIn: '24h' });
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
        }
        catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },
    register: async (req, res) => {
        try {
            const { nombre, username, email, password, empresa } = req.body;
            const db = await (0, database_1.getDatabase)();
            // Verificar si el usuario ya existe
            const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email o nombre de usuario ya está registrado'
                });
            }
            // Hash de la contraseña
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Insertar nuevo usuario
            const result = await db.run(`INSERT INTO users (nombre, username, email, password, empresa, role) 
         VALUES (?, ?, ?, ?, ?, ?)`, [nombre, username, email, hashedPassword, empresa || null, 'user']);
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                userId: result.lastID
            });
        }
        catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};
