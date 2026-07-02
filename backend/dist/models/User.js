"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
// src/models/User.ts
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    // Crear usuario
    static async create(userData) {
        const db = await (0, database_1.getDatabase)();
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        const result = await db.request()
            .input('Nombre', mssql_1.default.NVarChar, userData.nombre)
            .input('Email', mssql_1.default.NVarChar, userData.email)
            .input('PasswordHash', mssql_1.default.NVarChar, hashedPassword)
            .input('Rol', mssql_1.default.NVarChar, userData.role || 'Usuario')
            .query(`
                INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol)
                VALUES (@Nombre, @Email, @PasswordHash, @Rol);
                SELECT SCOPE_IDENTITY() AS Id;
            `);
        const userId = result.recordset[0].Id;
        // Obtener el usuario creado
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('Error al crear el usuario');
        }
        return user;
    }
    // Buscar por email
    static async findByEmail(email) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Email', mssql_1.default.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE Email = @Email');
        return result.recordset[0];
    }
    // Buscar por email o nombre (para login)
    static async findByEmailOrUsername(identifier) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Identifier', mssql_1.default.NVarChar, identifier)
            .query(`
                SELECT * FROM Usuarios 
                WHERE Email = @Identifier 
                OR Nombre = @Identifier
            `);
        return result.recordset[0];
    }
    // Buscar por ID
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, id)
            .query('SELECT * FROM Usuarios WHERE Id = @Id');
        return result.recordset[0];
    }
    // Actualizar usuario
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const request = db.request();
        const updates = [];
        if (data.nombre) {
            updates.push('Nombre = @Nombre');
            request.input('Nombre', mssql_1.default.NVarChar, data.nombre);
        }
        if (data.email) {
            updates.push('Email = @Email');
            request.input('Email', mssql_1.default.NVarChar, data.email);
        }
        if (data.role) {
            updates.push('Rol = @Rol');
            request.input('Rol', mssql_1.default.NVarChar, data.role);
        }
        if (data.password) {
            const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
            updates.push('PasswordHash = @PasswordHash');
            request.input('PasswordHash', mssql_1.default.NVarChar, hashedPassword);
        }
        if (updates.length === 0) {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            return user;
        }
        updates.push('FechaActualizacion = GETDATE()');
        request.input('Id', mssql_1.default.Int, id);
        await request.query(`
            UPDATE Usuarios 
            SET ${updates.join(', ')} 
            WHERE Id = @Id
        `);
        const updatedUser = await this.findById(id);
        if (!updatedUser) {
            throw new Error('Usuario no encontrado después de actualizar');
        }
        return updatedUser;
    }
    // Actualizar contraseña
    static async updatePassword(id, newPassword) {
        const db = await (0, database_1.getDatabase)();
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        const result = await db.request()
            .input('Id', mssql_1.default.Int, id)
            .input('PasswordHash', mssql_1.default.NVarChar, hashedPassword)
            .query(`
                UPDATE Usuarios 
                SET PasswordHash = @PasswordHash, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        return result.rowsAffected[0] > 0;
    }
    // Eliminar usuario
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.request()
            .input('Id', mssql_1.default.Int, id)
            .query('DELETE FROM Usuarios WHERE Id = @Id');
    }
    // Validar contraseña
    static async validatePassword(user, password) {
        return bcrypt_1.default.compare(password, user.PasswordHash);
    }
    // Obtener todos los usuarios
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT Id, Nombre, Email, Rol, Activo, FechaCreacion, FechaActualizacion, UltimoAcceso
            FROM Usuarios 
            ORDER BY Nombre
        `);
        return result.recordset;
    }
    // Activar/Desactivar usuario
    static async toggleActive(id) {
        const db = await (0, database_1.getDatabase)();
        const user = await this.findById(id);
        if (!user)
            return false;
        const newStatus = user.Activo ? 0 : 1;
        const result = await db.request()
            .input('Id', mssql_1.default.Int, id)
            .input('Activo', mssql_1.default.Int, newStatus)
            .query(`
                UPDATE Usuarios 
                SET Activo = @Activo, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        return result.rowsAffected[0] > 0;
    }
    // Cambiar rol
    static async changeRole(id, newRole) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, id)
            .input('Rol', mssql_1.default.NVarChar, newRole)
            .query(`
                UPDATE Usuarios 
                SET Rol = @Rol, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        return result.rowsAffected[0] > 0;
    }
    // Actualizar último acceso
    static async updateLastAccess(id) {
        const db = await (0, database_1.getDatabase)();
        await db.request()
            .input('Id', mssql_1.default.Int, id)
            .query(`
                UPDATE Usuarios 
                SET UltimoAcceso = GETDATE() 
                WHERE Id = @Id
            `);
    }
    // Obtener estadísticas
    static async getStats() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT 
                COUNT(*) AS Total,
                SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END) AS Activos,
                SUM(CASE WHEN Activo = 0 THEN 1 ELSE 0 END) AS Inactivos,
                SUM(CASE WHEN Rol = 'admin' THEN 1 ELSE 0 END) AS Admins,
                SUM(CASE WHEN Rol = 'Usuario' THEN 1 ELSE 0 END) AS Usuarios
            FROM Usuarios
        `);
        return result.recordset[0];
    }
}
exports.UserModel = UserModel;
exports.default = UserModel;
//# sourceMappingURL=User.js.map