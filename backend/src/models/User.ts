// src/models/User.ts
import { getDatabase } from '../config/database';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
    Id: number;
    Nombre: string;
    Email: string;
    PasswordHash: string;
    Rol: string;
    Activo: boolean;
    FechaCreacion: string;
    FechaActualizacion: string | null;
    UltimoAcceso: string | null;
}

export interface CreateUserDTO {
    nombre: string;
    email: string;
    password: string;
    username?: string;
    empresa?: string;
    role?: string;
}

export class UserModel {
    // Crear usuario
    static async create(userData: CreateUserDTO): Promise<User> {
        const db = await getDatabase();
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const result = await db.request()
            .input('Nombre', sql.NVarChar, userData.nombre)
            .input('Email', sql.NVarChar, userData.email)
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .input('Rol', sql.NVarChar, userData.role || 'Usuario')
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
    static async findByEmail(email: string): Promise<User | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE Email = @Email');
        
        return result.recordset[0];
    }

    // Buscar por email o nombre (para login)
    static async findByEmailOrUsername(identifier: string): Promise<User | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Identifier', sql.NVarChar, identifier)
            .query(`
                SELECT * FROM Usuarios 
                WHERE Email = @Identifier 
                OR Nombre = @Identifier
            `);
        
        return result.recordset[0];
    }

    // Buscar por ID
    static async findById(id: number): Promise<User | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, id)
            .query('SELECT * FROM Usuarios WHERE Id = @Id');
        
        return result.recordset[0];
    }

    // Actualizar usuario
    static async update(id: number, data: Partial<CreateUserDTO>): Promise<User> {
        const db = await getDatabase();
        const request = db.request();
        const updates: string[] = [];

        if (data.nombre) {
            updates.push('Nombre = @Nombre');
            request.input('Nombre', sql.NVarChar, data.nombre);
        }

        if (data.email) {
            updates.push('Email = @Email');
            request.input('Email', sql.NVarChar, data.email);
        }

        if (data.role) {
            updates.push('Rol = @Rol');
            request.input('Rol', sql.NVarChar, data.role);
        }

        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            updates.push('PasswordHash = @PasswordHash');
            request.input('PasswordHash', sql.NVarChar, hashedPassword);
        }

        if (updates.length === 0) {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            return user;
        }

        updates.push('FechaActualizacion = GETDATE()');
        request.input('Id', sql.Int, id);

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
    static async updatePassword(id: number, newPassword: string): Promise<boolean> {
        const db = await getDatabase();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await db.request()
            .input('Id', sql.Int, id)
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .query(`
                UPDATE Usuarios 
                SET PasswordHash = @PasswordHash, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);

        return result.rowsAffected[0] > 0;
    }

    // Eliminar usuario
    static async delete(id: number): Promise<void> {
        const db = await getDatabase();
        await db.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM Usuarios WHERE Id = @Id');
    }

    // Validar contraseña
    static async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.PasswordHash);
    }

    // Obtener todos los usuarios
    static async findAll(): Promise<User[]> {
        const db = await getDatabase();
        const result = await db.request().query(`
            SELECT Id, Nombre, Email, Rol, Activo, FechaCreacion, FechaActualizacion, UltimoAcceso
            FROM Usuarios 
            ORDER BY Nombre
        `);
        return result.recordset;
    }

    // Activar/Desactivar usuario
    static async toggleActive(id: number): Promise<boolean> {
        const db = await getDatabase();
        
        const user = await this.findById(id);
        if (!user) return false;

        const newStatus = user.Activo ? 0 : 1;
        const result = await db.request()
            .input('Id', sql.Int, id)
            .input('Activo', sql.Int, newStatus)
            .query(`
                UPDATE Usuarios 
                SET Activo = @Activo, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);

        return result.rowsAffected[0] > 0;
    }

    // Cambiar rol
    static async changeRole(id: number, newRole: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, id)
            .input('Rol', sql.NVarChar, newRole)
            .query(`
                UPDATE Usuarios 
                SET Rol = @Rol, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);

        return result.rowsAffected[0] > 0;
    }

    // Actualizar último acceso
    static async updateLastAccess(id: number): Promise<void> {
        const db = await getDatabase();
        await db.request()
            .input('Id', sql.Int, id)
            .query(`
                UPDATE Usuarios 
                SET UltimoAcceso = GETDATE() 
                WHERE Id = @Id
            `);
    }

    // Obtener estadísticas
    static async getStats(): Promise<any> {
        const db = await getDatabase();
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

export default UserModel;