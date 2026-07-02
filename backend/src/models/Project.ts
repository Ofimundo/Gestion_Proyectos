import { getDatabase } from '../database/database';
import sql from 'mssql';

export interface Project {
    id: string;
    code: string;
    name: string;
    client: string;
    leader: string;
    description: string | null;
    technologies: string | null;
    commercial_manager: string | null;
    sale_amount: number;
    hh_implementation: number;
    hh_period: number;
    start_date: string | null;
    end_date: string | null;
    client_contact: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectDTO {
    name: string;
    client: string;
    leader: string;
    description?: string;
    technologies?: string;
    saleAmount?: number;
    hhPlanificadas?: number;
    hhReal?: number;
    startDate?: string;
    endDate?: string;
}

export class ProjectModel {
    static generateCode(name: string): string {
        const letters = name
            .replace(/[^a-zA-Z]/g, '')
            .toUpperCase()
            .slice(0, 4)
            .padEnd(4, 'X');
        
        const numbers = Math.floor(1000 + Math.random() * 9000).toString();
        return `${letters}-${numbers}`;
    }

    static async create(data: CreateProjectDTO): Promise<Project> {
        const db = await getDatabase();
        const code = this.generateCode(data.name);

        const result = await db.request()
            .input('Codigo', sql.NVarChar, code)
            .input('NombreProyecto', sql.NVarChar, data.name)
            .input('Cliente', sql.NVarChar, data.client)
            .input('Lider', sql.NVarChar, data.leader)
            .input('Venta', sql.Decimal(18, 2), data.saleAmount || 0)
            .input('HHPlanificadas', sql.Decimal(10, 2), data.hhPlanificadas || 0)
            .input('HHReal', sql.Decimal(10, 2), data.hhReal || 0)
            .input('FechaInicio', sql.Date, data.startDate ? new Date(data.startDate) : null)
            .input('FechaFin', sql.Date, data.endDate ? new Date(data.endDate) : null)
            .input('Descripcion', sql.NVarChar, data.description || null)
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

    static async findById(id: string | number): Promise<Project | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query('SELECT * FROM Proyectos WHERE Id = @Id');
        
        const project = result.recordset[0];
        return this.parseProject(project);
    }

    static async getByCode(code: string): Promise<Project | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('code', sql.NVarChar, code)
            .query('SELECT * FROM Proyectos WHERE Codigo = @code');
        
        const project = result.recordset[0];
        return this.parseProject(project);
    }

    static async getProjectSummary(id: string | number): Promise<any | undefined> {
        const p = await this.findById(id);
        if (!p) return undefined;

        const db = await getDatabase();
        const res = await db.request()
            .input('Id', sql.Int, Number(id))
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

    static async getProjectResources(id: string | number): Promise<any[]> {
        const db = await getDatabase();
        const res = await db.request()
            .input('Id', sql.Int, Number(id))
            .query(`
                SELECT p.* 
                FROM Profesionales p
                INNER JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
                WHERE pa.SolicitudId = @Id
            `);

        return res.recordset.map((prof: any) => ({
            id: String(prof.Id),
            name: prof.Nombre,
            email: prof.Email,
            role: prof.Cargo
        }));
    }

    static async updateStatus(id: string | number, status: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .input('Estado', sql.NVarChar, status)
            .query('UPDATE Proyectos SET Estado = @Estado, FechaActualizacion = GETDATE() WHERE Id = @Id');

        return result.rowsAffected[0] > 0;
    }

    static async findAll(): Promise<Project[]> {
        const db = await getDatabase();
        const result = await db.request()
            .query('SELECT * FROM Proyectos ORDER BY FechaCreacion DESC');
        
        return result.recordset.map(p => this.parseProject(p)!);
    }

    static async update(id: string | number, data: Partial<CreateProjectDTO>): Promise<Project> {
        const db = await getDatabase();
        const fields: string[] = [];
        const request = db.request();

        if (data.name) {
            fields.push('NombreProyecto = @NombreProyecto');
            request.input('NombreProyecto', sql.NVarChar, data.name);
        }
        if (data.client) {
            fields.push('Cliente = @Cliente');
            request.input('Cliente', sql.NVarChar, data.client);
        }
        if (data.leader) {
            fields.push('Lider = @Lider');
            request.input('Lider', sql.NVarChar, data.leader);
        }
        if (data.saleAmount !== undefined) {
            fields.push('Venta = @Venta');
            request.input('Venta', sql.Decimal(18, 2), data.saleAmount);
        }
        if (data.hhPlanificadas !== undefined) {
            fields.push('HHPlanificadas = @HHPlanificadas');
            request.input('HHPlanificadas', sql.Decimal(10, 2), data.hhPlanificadas);
        }
        if (data.hhReal !== undefined) {
            fields.push('HHReal = @HHReal');
            request.input('HHReal', sql.Decimal(10, 2), data.hhReal);
        }
        if (data.startDate !== undefined) {
            fields.push('FechaInicio = @FechaInicio');
            request.input('FechaInicio', sql.Date, data.startDate ? new Date(data.startDate) : null);
        }
        if (data.endDate !== undefined) {
            fields.push('FechaFin = @FechaFin');
            request.input('FechaFin', sql.Date, data.endDate ? new Date(data.endDate) : null);
        }
        if (data.description !== undefined) {
            fields.push('Descripcion = @Descripcion');
            request.input('Descripcion', sql.NVarChar, data.description);
        }

        if (fields.length > 0) {
            request.input('Id', sql.Int, Number(id));
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

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        await db.request()
            .input('Id', sql.Int, Number(id))
            .query('DELETE FROM Proyectos WHERE Id = @Id');
    }

    static async search(term: string): Promise<Project[]> {
        const db = await getDatabase();
        const searchTerm = `%${term}%`;

        const result = await db.request()
            .input('searchTerm', sql.NVarChar, searchTerm)
            .query(`
                SELECT * FROM Proyectos 
                WHERE NombreProyecto LIKE @searchTerm 
                   OR Cliente LIKE @searchTerm 
                   OR Lider LIKE @searchTerm
                ORDER BY FechaCreacion DESC
            `);

        return result.recordset.map(p => this.parseProject(p)!);
    }

    static async getStats(): Promise<any> {
        const db = await getDatabase();
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

    private static parseProject(p: any): Project | undefined {
        if (!p) return undefined;
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
export default ProjectModel;