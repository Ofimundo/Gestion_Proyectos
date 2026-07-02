"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
class ProfessionalModel {
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const horas = data.horasDisponibles !== undefined ? data.horasDisponibles : 168;
        const horarioJson = data.horario ? JSON.stringify(data.horario) : null;
        const result = await db.request()
            .input('Nombre', mssql_1.default.NVarChar, data.name)
            .input('Email', mssql_1.default.NVarChar, data.email)
            .input('Cargo', mssql_1.default.NVarChar, data.role)
            .input('HorasDisponibles', mssql_1.default.Decimal(10, 2), horas)
            .input('Horario', mssql_1.default.NVarChar, horarioJson)
            .query(`
                INSERT INTO Profesionales (Nombre, Email, Cargo, HorasDisponibles, Horario, Activo, FechaCreacion)
                VALUES (@Nombre, @Email, @Cargo, @HorasDisponibles, @Horario, 1, GETDATE());
                SELECT SCOPE_IDENTITY() AS Id;
            `);
        const newId = result.recordset[0].Id;
        const professional = await this.findById(newId);
        if (!professional) {
            throw new Error('Error al crear el profesional');
        }
        return professional;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query(`
                SELECT p.*, 
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                WHERE p.Id = @Id
            `);
        const professional = result.recordset[0];
        if (!professional)
            return undefined;
        const parsed = this.parseProfessional(professional);
        if (parsed) {
            parsed.proyectosAsignados = await this.getProyectosAsignados(id);
        }
        return parsed;
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                ORDER BY p.Nombre
            `);
        const list = [];
        for (const p of result.recordset) {
            const parsed = this.parseProfessional(p);
            if (parsed) {
                parsed.proyectosAsignados = await this.getProyectosAsignados(p.Id);
                list.push(parsed);
            }
        }
        return list;
    }
    static async getProyectosAsignados(professionalId) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('professionalId', mssql_1.default.Int, Number(professionalId))
            .query(`
                SELECT pa.SolicitudId, s.NombreProyecto, s.NombreSolicitante, s.Area, pa.EstimacionHoras,
                       pa.FechaAsignacion, pa.FechaInicioEstimada, pa.FechaFinEstimada, pa.Estado,
                       pa.ProfesionalId, p.Nombre AS profesionalNombre
                FROM ProyectosAsignados pa
                INNER JOIN SolicitudesProyecto s ON pa.SolicitudId = s.Id
                INNER JOIN Profesionales p ON pa.ProfesionalId = p.Id
                WHERE pa.ProfesionalId = @professionalId
                ORDER BY pa.FechaAsignacion DESC
            `);
        return result.recordset.map((a) => ({
            solicitudId: String(a.SolicitudId),
            nombreProyecto: a.NombreProyecto,
            nombreSolicitante: a.NombreSolicitante,
            area: a.Area,
            estimacionHoras: Number(a.EstimacionHoras || 0),
            fechaAsignacion: a.FechaAsignacion ? new Date(a.FechaAsignacion).toISOString().split('T')[0] : '',
            fechaInicioEstimada: a.FechaInicioEstimada ? new Date(a.FechaInicioEstimada).toISOString().split('T')[0] : '',
            fechaFinEstimada: a.FechaFinEstimada ? new Date(a.FechaFinEstimada).toISOString().split('T')[0] : '',
            estado: a.Estado,
            profesionalId: String(a.ProfesionalId),
            profesionalNombre: a.profesionalNombre
        }));
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const fields = [];
        const request = db.request();
        if (data.name) {
            fields.push('Nombre = @Nombre');
            request.input('Nombre', mssql_1.default.NVarChar, data.name);
        }
        if (data.email) {
            fields.push('Email = @Email');
            request.input('Email', mssql_1.default.NVarChar, data.email);
        }
        if (data.role) {
            fields.push('Cargo = @Cargo');
            request.input('Cargo', mssql_1.default.NVarChar, data.role);
        }
        if (data.horasDisponibles !== undefined) {
            fields.push('HorasDisponibles = @HorasDisponibles');
            request.input('HorasDisponibles', mssql_1.default.Decimal(10, 2), data.horasDisponibles);
        }
        if (data.horario) {
            fields.push('Horario = @Horario');
            request.input('Horario', mssql_1.default.NVarChar, JSON.stringify(data.horario));
        }
        if (fields.length > 0) {
            request.input('Id', mssql_1.default.Int, Number(id));
            await request.query(`
                UPDATE Profesionales 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        }
        const professional = await this.findById(id);
        if (!professional) {
            throw new Error('Profesional no encontrado');
        }
        return professional;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        const reqId = Number(id);
        // Eliminar asignaciones asociadas primero
        await db.request().input('Id', mssql_1.default.Int, reqId).query('DELETE FROM ProyectosAsignados WHERE ProfesionalId = @Id');
        await db.request().input('Id', mssql_1.default.Int, reqId).query('DELETE FROM HorasAsignadasMensual WHERE ProfesionalId = @Id');
        // Eliminar profesional
        await db.request()
            .input('Id', mssql_1.default.Int, reqId)
            .query('DELETE FROM Profesionales WHERE Id = @Id');
    }
    static async search(term) {
        const db = await (0, database_1.getDatabase)();
        const searchTerm = `%${term}%`;
        const result = await db.request()
            .input('searchTerm', mssql_1.default.NVarChar, searchTerm)
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p
                WHERE p.Nombre LIKE @searchTerm 
                   OR p.Email LIKE @searchTerm 
                   OR p.Cargo LIKE @searchTerm
                ORDER BY p.Nombre
            `);
        return result.recordset.map((p) => this.parseProfessional(p));
    }
    static async getProjectProfessionals(projectId) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('projectId', mssql_1.default.Int, Number(projectId))
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p
                INNER JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
                WHERE pa.SolicitudId = @projectId
                ORDER BY p.Nombre
            `);
        return result.recordset.map((p) => this.parseProfessional(p));
    }
    static async getByEmail(email) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('email', mssql_1.default.NVarChar, email)
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                WHERE p.Email = @email
            `);
        const professional = result.recordset[0];
        return this.parseProfessional(professional);
    }
    static async getProfessionalsWithHours() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT 
                p.Id AS id,
                p.Nombre AS name,
                p.Email AS email,
                p.Cargo AS role,
                'Tecnología' AS department,
                ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked,
                COUNT(pa.Id) AS project_count,
                ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS total_hours_projects
            FROM Profesionales p
            LEFT JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
            GROUP BY p.Id, p.Nombre, p.Email, p.Cargo
            ORDER BY p.Nombre
        `);
        return result.recordset;
    }
    static async getAvailableProfessionals() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT p.*,
                   ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
            FROM Profesionales p
            WHERE p.Id NOT IN (
                SELECT DISTINCT ProfesionalId 
                FROM ProyectosAsignados pa
                INNER JOIN SolicitudesProyecto s ON pa.SolicitudId = s.Id
                WHERE s.Estado != 'Rechazado' AND s.Estado != 'Completada'
            )
            ORDER BY p.Nombre
        `);
        return result.recordset.map((p) => this.parseProfessional(p));
    }
    static async getStats() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN Cargo = 'Desarrollador' THEN 1 ELSE 0 END) AS desarrolladores,
                SUM(CASE WHEN Cargo = 'Analista' THEN 1 ELSE 0 END) AS analistas,
                SUM(CASE WHEN Cargo = 'QA' THEN 1 ELSE 0 END) AS qa,
                ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados), 0) AS total_hours_worked,
                ISNULL((SELECT AVG(EstimacionHoras) FROM ProyectosAsignados), 0) AS avg_hours_worked
            FROM Profesionales
        `);
        return result.recordset[0];
    }
    static async getProfessionalsBySpecialty(specialty) {
        // Since there is no specialties column in Profesionales table, we return empty list or search name/role
        return [];
    }
    static async assignToProject(professionalId, projectId) {
        const { default: AsignacionModel } = await Promise.resolve().then(() => __importStar(require('./Asignacion')));
        await AsignacionModel.assign({
            solicitudId: projectId,
            profesionalId: professionalId,
            estimacionHoras: 0,
            fechaInicioEstimada: '',
            fechaFinEstimada: ''
        });
    }
    static async removeFromProject(professionalId, projectId) {
        const { default: AsignacionModel } = await Promise.resolve().then(() => __importStar(require('./Asignacion')));
        await AsignacionModel.remove(professionalId, projectId);
    }
    static parseProfessional(p) {
        if (!p)
            return undefined;
        let horarioParsed = null;
        if (p.Horario) {
            try {
                horarioParsed = JSON.parse(p.Horario);
            }
            catch (e) {
                console.error('Error parsing horario JSON:', e);
            }
        }
        return {
            id: String(p.Id),
            name: p.Nombre,
            nombre: p.Nombre,
            email: p.Email,
            role: p.Cargo,
            cargo: p.Cargo,
            activo: p.Activo !== undefined ? Boolean(p.Activo) : true,
            horasDisponibles: p.HorasDisponibles !== undefined ? Number(p.HorasDisponibles) : 168,
            horario: horarioParsed,
            department: 'Tecnología',
            phone: null,
            specialties: [],
            hours_worked: Number(p.hours_worked || p.HorasAsignadasMes || 0),
            created_at: p.FechaCreacion ? new Date(p.FechaCreacion).toISOString() : new Date().toISOString(),
            updated_at: p.FechaActualizacion ? new Date(p.FechaActualizacion).toISOString() : new Date().toISOString()
        };
    }
}
exports.ProfessionalModel = ProfessionalModel;
exports.default = ProfessionalModel;
//# sourceMappingURL=Professional.js.map