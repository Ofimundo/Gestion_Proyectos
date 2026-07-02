"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
class ProjectModel {
    static generateCode(name) {
        const letters = name
            .replace(/[^a-zA-Z]/g, '')
            .toUpperCase()
            .slice(0, 4)
            .padEnd(4, 'X');
        const numbers = Math.floor(1000 + Math.random() * 9000).toString();
        return `${letters}-${numbers}`;
    }
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const code = this.generateCode(data.name);
        const result = await db.request()
            .input('Codigo', mssql_1.default.NVarChar, code)
            .input('NombreProyecto', mssql_1.default.NVarChar, data.name)
            .input('Cliente', mssql_1.default.NVarChar, data.client)
            .input('Lider', mssql_1.default.NVarChar, data.leader)
            .input('Venta', mssql_1.default.Decimal(18, 2), data.saleAmount || 0)
            .input('HHPlanificadas', mssql_1.default.Decimal(10, 2), data.hhPlanificadas || 0)
            .input('HHReal', mssql_1.default.Decimal(10, 2), data.hhReal || 0)
            .input('FechaInicio', mssql_1.default.Date, data.startDate ? new Date(data.startDate) : null)
            .input('FechaFin', mssql_1.default.Date, data.endDate ? new Date(data.endDate) : null)
            .input('Descripcion', mssql_1.default.NVarChar, data.description || null)
            .query(`
                INSERT INTO Proyectos (Codigo, NombreProyecto, Cliente, Lider, Estado, Avance, Venta, HHPlanificadas, HHReal, FechaInicio, FechaFin, Descripcion, FechaCreacion)
                VALUES (@Codigo, @NombreProyecto, @Cliente, @Lider, 'No Iniciada', 0, @Venta, @HHPlanificadas, @HHReal, @FechaInicio, @FechaFin, @Descripcion, GETDATE());
                SELECT SCOPE_IDENTITY() AS Id;
            `);
        const newId = result.recordset[0].Id;
        const project = await this.findById(newId);
        if (!project) {
            throw new Error('Error al crear el proyecto');
        }
        return project;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('SELECT * FROM Proyectos WHERE Id = @Id');
        const project = result.recordset[0];
        return this.parseProject(project);
    }
    static async getByCode(code) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('code', mssql_1.default.NVarChar, code)
            .query('SELECT * FROM Proyectos WHERE Codigo = @code');
        const project = result.recordset[0];
        return this.parseProject(project);
    }
    static async getProjectSummary(id) {
        const p = await this.findById(id);
        if (!p)
            return undefined;
        const db = await (0, database_1.getDatabase)();
        const res = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query(`
                SELECT p.Nombre 
                FROM Profesionales p
                INNER JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
                WHERE pa.SolicitudId = @Id
            `);
        return {
            ...p,
            resources_count: res.recordset.length,
            stages_count: 0,
            risks_count: 0
        };
    }
    static async getProjectResources(id) {
        const db = await (0, database_1.getDatabase)();
        const res = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query(`
                SELECT p.* 
                FROM Profesionales p
                INNER JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
                WHERE pa.SolicitudId = @Id
            `);
        return res.recordset.map((prof) => ({
            id: String(prof.Id),
            name: prof.Nombre,
            email: prof.Email,
            role: prof.Cargo
        }));
    }
    static async updateStatus(id, status) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .input('Estado', mssql_1.default.NVarChar, status)
            .query('UPDATE Proyectos SET Estado = @Estado, FechaActualizacion = GETDATE() WHERE Id = @Id');
        return result.rowsAffected[0] > 0;
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .query('SELECT * FROM Proyectos ORDER BY FechaCreacion DESC');
        return result.recordset.map(p => this.parseProject(p));
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const fields = [];
        const request = db.request();
        if (data.name) {
            fields.push('NombreProyecto = @NombreProyecto');
            request.input('NombreProyecto', mssql_1.default.NVarChar, data.name);
        }
        if (data.client) {
            fields.push('Cliente = @Cliente');
            request.input('Cliente', mssql_1.default.NVarChar, data.client);
        }
        if (data.leader) {
            fields.push('Lider = @Lider');
            request.input('Lider', mssql_1.default.NVarChar, data.leader);
        }
        if (data.saleAmount !== undefined) {
            fields.push('Venta = @Venta');
            request.input('Venta', mssql_1.default.Decimal(18, 2), data.saleAmount);
        }
        if (data.hhPlanificadas !== undefined) {
            fields.push('HHPlanificadas = @HHPlanificadas');
            request.input('HHPlanificadas', mssql_1.default.Decimal(10, 2), data.hhPlanificadas);
        }
        if (data.hhReal !== undefined) {
            fields.push('HHReal = @HHReal');
            request.input('HHReal', mssql_1.default.Decimal(10, 2), data.hhReal);
        }
        if (data.startDate !== undefined) {
            fields.push('FechaInicio = @FechaInicio');
            request.input('FechaInicio', mssql_1.default.Date, data.startDate ? new Date(data.startDate) : null);
        }
        if (data.endDate !== undefined) {
            fields.push('FechaFin = @FechaFin');
            request.input('FechaFin', mssql_1.default.Date, data.endDate ? new Date(data.endDate) : null);
        }
        if (data.description !== undefined) {
            fields.push('Descripcion = @Descripcion');
            request.input('Descripcion', mssql_1.default.NVarChar, data.description);
        }
        if (fields.length > 0) {
            request.input('Id', mssql_1.default.Int, Number(id));
            await request.query(`
                UPDATE Proyectos 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        }
        const project = await this.findById(id);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
        return project;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('DELETE FROM Proyectos WHERE Id = @Id');
    }
    static async search(term) {
        const db = await (0, database_1.getDatabase)();
        const searchTerm = `%${term}%`;
        const result = await db.request()
            .input('searchTerm', mssql_1.default.NVarChar, searchTerm)
            .query(`
                SELECT * FROM Proyectos 
                WHERE NombreProyecto LIKE @searchTerm 
                   OR Cliente LIKE @searchTerm 
                   OR Lider LIKE @searchTerm
                ORDER BY FechaCreacion DESC
            `);
        return result.recordset.map(p => this.parseProject(p));
    }
    static async getStats() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN Estado = 'En Curso' THEN 1 ELSE 0 END) AS en_curso,
                SUM(CASE WHEN Estado = 'No Iniciada' THEN 1 ELSE 0 END) AS no_iniciadas,
                SUM(CASE WHEN Estado = 'Completada' THEN 1 ELSE 0 END) AS completadas,
                ISNULL(SUM(Venta), 0) AS total_sale,
                ISNULL(SUM(HHPlanificadas), 0) AS total_hh_planificadas,
                ISNULL(SUM(HHReal), 0) AS total_hh_real
            FROM Proyectos
        `);
        return result.recordset[0];
    }
    static parseProject(p) {
        if (!p)
            return undefined;
        return {
            id: String(p.Id),
            code: p.Codigo,
            name: p.NombreProyecto,
            client: p.Cliente,
            leader: p.Lider,
            description: p.Descripcion,
            technologies: '',
            commercial_manager: '',
            sale_amount: Number(p.Venta || 0),
            hh_implementation: Number(p.HHPlanificadas || 0),
            hh_period: 0,
            start_date: p.FechaInicio ? new Date(p.FechaInicio).toISOString().split('T')[0] : null,
            end_date: p.FechaFin ? new Date(p.FechaFin).toISOString().split('T')[0] : null,
            client_contact: '',
            status: p.Estado,
            created_at: p.FechaCreacion ? new Date(p.FechaCreacion).toISOString() : new Date().toISOString(),
            updated_at: p.FechaActualizacion ? new Date(p.FechaActualizacion).toISOString() : new Date().toISOString()
        };
    }
}
exports.ProjectModel = ProjectModel;
exports.default = ProjectModel;
//# sourceMappingURL=Project.js.map