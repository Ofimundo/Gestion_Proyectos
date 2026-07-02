import { getDatabase } from '../database/database';
import sql from 'mssql';

export interface ProyectoAsignado {
    solicitudId: string;
    nombreProyecto: string;
    nombreSolicitante: string;
    area: string;
    estimacionHoras: number;
    fechaAsignacion: string;
    fechaInicioEstimada: string;
    fechaFinEstimada: string;
    estado: string;
    profesionalId: string;
    profesionalNombre: string;
}

export interface Professional {
    id: string;
    name: string;
    nombre?: string;
    email: string;
    role: string;
    cargo?: string;
    activo?: boolean;
    horasDisponibles?: number;
    horario?: any;
    department: string | null;
    phone: string | null;
    specialties: string[];
    hours_worked: number;
    proyectosAsignados?: ProyectoAsignado[];
    created_at: string;
    updated_at: string;
}

export interface CreateProfessionalDTO {
    name: string;
    email: string;
    role: string;
    horasDisponibles?: number;
    horario?: any;
    department?: string;
    phone?: string;
    specialties?: string[];
}

export class ProfessionalModel {
    static async create(data: CreateProfessionalDTO): Promise<Professional> {
        const db = await getDatabase();
        const horas = data.horasDisponibles !== undefined ? data.horasDisponibles : 168;
        const horarioJson = data.horario ? JSON.stringify(data.horario) : null;

        const result = await db.request()
            .input('Nombre', sql.NVarChar, data.name)
            .input('Email', sql.NVarChar, data.email)
            .input('Cargo', sql.NVarChar, data.role)
            .input('HorasDisponibles', sql.Decimal(10, 2), horas)
            .input('Horario', sql.NVarChar, horarioJson)
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

    static async findById(id: string | number): Promise<Professional | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query(`
                SELECT p.*, 
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                WHERE p.Id = @Id
            `);
        
        const professional = result.recordset[0];
        if (!professional) return undefined;

        const parsed = this.parseProfessional(professional);
        if (parsed) {
            parsed.proyectosAsignados = await this.getProyectosAsignados(id);
        }
        return parsed;
    }

    static async findAll(): Promise<Professional[]> {
        const db = await getDatabase();
        const result = await db.request()
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                ORDER BY p.Nombre
            `);
        
        const list: Professional[] = [];
        for (const p of result.recordset) {
            const parsed = this.parseProfessional(p);
            if (parsed) {
                parsed.proyectosAsignados = await this.getProyectosAsignados(p.Id);
                list.push(parsed);
            }
        }
        return list;
    }

    static async getProyectosAsignados(professionalId: string | number): Promise<ProyectoAsignado[]> {
        const db = await getDatabase();
        const result = await db.request()
            .input('professionalId', sql.Int, Number(professionalId))
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

        return result.recordset.map((a: any) => ({
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

    static async update(id: string | number, data: Partial<CreateProfessionalDTO>): Promise<Professional> {
        const db = await getDatabase();
        const fields: string[] = [];
        const request = db.request();

        if (data.name) {
            fields.push('Nombre = @Nombre');
            request.input('Nombre', sql.NVarChar, data.name);
        }
        if (data.email) {
            fields.push('Email = @Email');
            request.input('Email', sql.NVarChar, data.email);
        }
        if (data.role) {
            fields.push('Cargo = @Cargo');
            request.input('Cargo', sql.NVarChar, data.role);
        }
        if (data.horasDisponibles !== undefined) {
            fields.push('HorasDisponibles = @HorasDisponibles');
            request.input('HorasDisponibles', sql.Decimal(10, 2), data.horasDisponibles);
        }
        if (data.horario) {
            fields.push('Horario = @Horario');
            request.input('Horario', sql.NVarChar, JSON.stringify(data.horario));
        }

        if (fields.length > 0) {
            request.input('Id', sql.Int, Number(id));
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

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        const reqId = Number(id);
        
        // Eliminar asignaciones asociadas primero
        await db.request().input('Id', sql.Int, reqId).query('DELETE FROM ProyectosAsignados WHERE ProfesionalId = @Id');
        await db.request().input('Id', sql.Int, reqId).query('DELETE FROM HorasAsignadasMensual WHERE ProfesionalId = @Id');
        
        // Eliminar profesional
        await db.request()
            .input('Id', sql.Int, reqId)
            .query('DELETE FROM Profesionales WHERE Id = @Id');
    }

    static async search(term: string): Promise<Professional[]> {
        const db = await getDatabase();
        const searchTerm = `%${term}%`;

        const result = await db.request()
            .input('searchTerm', sql.NVarChar, searchTerm)
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p
                WHERE p.Nombre LIKE @searchTerm 
                   OR p.Email LIKE @searchTerm 
                   OR p.Cargo LIKE @searchTerm
                ORDER BY p.Nombre
            `);

        return result.recordset.map((p: any) => this.parseProfessional(p)!);
    }

    static async getProjectProfessionals(projectId: string | number): Promise<Professional[]> {
        const db = await getDatabase();

        const result = await db.request()
            .input('projectId', sql.Int, Number(projectId))
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p
                INNER JOIN ProyectosAsignados pa ON p.Id = pa.ProfesionalId
                WHERE pa.SolicitudId = @projectId
                ORDER BY p.Nombre
            `);

        return result.recordset.map((p: any) => this.parseProfessional(p)!);
    }

    static async getByEmail(email: string): Promise<Professional | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT p.*,
                       ISNULL((SELECT SUM(EstimacionHoras) FROM ProyectosAsignados WHERE ProfesionalId = p.Id), 0) AS hours_worked
                FROM Profesionales p 
                WHERE p.Email = @email
            `);
        
        const professional = result.recordset[0];
        return this.parseProfessional(professional);
    }

    static async getProfessionalsWithHours(): Promise<any[]> {
        const db = await getDatabase();
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

    static async getAvailableProfessionals(): Promise<Professional[]> {
        const db = await getDatabase();
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

        return result.recordset.map((p: any) => this.parseProfessional(p)!);
    }

    static async getStats(): Promise<any> {
        const db = await getDatabase();
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

    static async getProfessionalsBySpecialty(specialty: string): Promise<Professional[]> {
        // Since there is no specialties column in Profesionales table, we return empty list or search name/role
        return [];
    }

    static async assignToProject(professionalId: string | number, projectId: string | number): Promise<void> {
        const { default: AsignacionModel } = await import('./Asignacion');
        await AsignacionModel.assign({
            solicitudId: projectId,
            profesionalId: professionalId,
            estimacionHoras: 0,
            fechaInicioEstimada: '',
            fechaFinEstimada: ''
        });
    }

    static async removeFromProject(professionalId: string | number, projectId: string | number): Promise<void> {
        const { default: AsignacionModel } = await import('./Asignacion');
        await AsignacionModel.remove(professionalId, projectId);
    }

    private static parseProfessional(p: any): Professional | undefined {
        if (!p) return undefined;
        
        let horarioParsed = null;
        if (p.Horario) {
            try {
                horarioParsed = JSON.parse(p.Horario);
            } catch (e) {
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
export default ProfessionalModel;