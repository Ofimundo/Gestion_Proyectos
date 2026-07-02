"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
exports.authController = {
    // Registrar usuario
    register: async (req, res) => {
        try {
            const { name, username, email, password, empresa } = req.body;
            const db = await (0, database_1.getDatabase)();
            // Verificar si el email ya existe
            const existingEmail = await db.request()
                .input('Email', mssql_1.default.NVarChar, email.toLowerCase())
                .query('SELECT * FROM Usuarios WHERE Email = @Email');
            if (existingEmail.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
            }
            // Verificar si el nombre ya existe
            const existingName = await db.request()
                .input('Nombre', mssql_1.default.NVarChar, username)
                .query('SELECT * FROM Usuarios WHERE Nombre = @Nombre');
            if (existingName.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }
            // Hash de la contraseña
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Crear usuario
            const result = await db.request()
                .input('Nombre', mssql_1.default.NVarChar, name)
                .input('Email', mssql_1.default.NVarChar, email.toLowerCase())
                .input('PasswordHash', mssql_1.default.NVarChar, hashedPassword)
                .input('Rol', mssql_1.default.NVarChar, 'Usuario')
                .query(`
          INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol)
          VALUES (@Nombre, @Email, @PasswordHash, @Rol);
          SELECT SCOPE_IDENTITY() AS Id;
        `);
            const userId = result.recordset[0].Id;
            // Obtener el usuario creado
            const user = await User_1.UserModel.findById(userId);
            // Generar token
            const token = jsonwebtoken_1.default.sign({ id: userId, email: email.toLowerCase(), role: 'Usuario' }, process.env.JWT_SECRET || 'tu_secreto_super_secreto', { expiresIn: '24h' });
            return res.json({
                success: true,
                user: {
                    id: user?.Id,
                    nombre: user?.Nombre,
                    email: user?.Email,
                    role: user?.Rol
                },
                token,
                message: 'Usuario registrado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en registro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar usuario'
            });
        }
    },
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const db = await (0, database_1.getDatabase)();
            // Buscar usuario por email o nombre
            const result = await db.request()
                .input('Identifier', mssql_1.default.NVarChar, email)
                .query(`
          SELECT * FROM Usuarios 
          WHERE Email = @Identifier 
          OR Nombre = @Identifier
        `);
            const user = result.recordset[0];
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            if (!user.Activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo. Contacta al administrador.'
                });
            }
            // Validar contraseña
            const isValid = await bcrypt_1.default.compare(password, user.PasswordHash);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            // Actualizar último acceso
            await User_1.UserModel.updateLastAccess(user.Id);
            // Generar token
            const token = jsonwebtoken_1.default.sign({ id: user.Id, email: user.Email, role: user.Rol }, process.env.JWT_SECRET || 'tu_secreto_super_secreto', { expiresIn: '24h' });
            return res.json({
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
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión'
            });
        }
    },
    // Verificar si usuario existe
    checkUsername: async (req, res) => {
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
            return res.json({
                success: true,
                exists: !!user,
                nombre: user?.Nombre || null
            });
        }
        catch (error) {
            console.error('Error en check-username:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar usuario'
            });
        }
    },
    // Restablecer contraseña por nombre de usuario
    resetPasswordByUsername: async (req, res) => {
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
            return res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        }
        catch (error) {
            console.error('Error en resetPasswordByUsername:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al restablecer la contraseña'
            });
        }
    },
    // Obtener usuario actual
    getMe: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            const user = await User_1.UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            return res.json({
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
            console.error('Error en getMe:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuario'
            });
        }
    },
    // Actualizar perfil
    updateProfile: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            const { name, email } = req.body;
            const updateData = {};
            if (name)
                updateData.nombre = name;
            if (email)
                updateData.email = email;
            const updatedUser = await User_1.UserModel.update(userId, updateData);
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            return res.json({
                success: true,
                user: {
                    id: updatedUser.Id,
                    nombre: updatedUser.Nombre,
                    email: updatedUser.Email,
                    role: updatedUser.Rol
                },
                message: 'Perfil actualizado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en updateProfile:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar perfil'
            });
        }
    },
    // Cambiar contraseña
    changePassword: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            const { currentPassword, newPassword } = req.body;
            const user = await User_1.UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            const isValid = await bcrypt_1.default.compare(currentPassword, user.PasswordHash);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }
            await User_1.UserModel.updatePassword(userId, newPassword);
            return res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        }
        catch (error) {
            console.error('Error en changePassword:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña'
            });
        }
    },
    // Obtener todos los usuarios (admin)
    getAllUsers: async (req, res) => {
        try {
            const users = await User_1.UserModel.findAll();
            return res.json({
                success: true,
                users
            });
        }
        catch (error) {
            console.error('Error en getAllUsers:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios'
            });
        }
    },
    // Cambiar rol de usuario (admin)
    changeUserRole: async (req, res) => {
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
            return res.json({
                success: true,
                message: 'Rol actualizado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en changeUserRole:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar rol'
            });
        }
    },
    // Activar/Desactivar usuario (admin)
    toggleUser: async (req, res) => {
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
            return res.json({
                success: true,
                message: 'Estado del usuario actualizado'
            });
        }
        catch (error) {
            console.error('Error en toggleUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar estado'
            });
        }
    },
    // Eliminar usuario (admin)
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.id;
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
            return res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en deleteUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
    }
};
//# sourceMappingURL=authController.js.map