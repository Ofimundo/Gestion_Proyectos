import { getDatabase } from '../database/database';
import sql from 'mssql';

export interface Ficha {
    id: string;
    codigo: string;
    nombreProyecto: string;
    cliente: string;
    lider: string;
    liderId?: string;
    descripcion: string;
    tecnologias: string;
    venta: number;
    hhImplementacion: number;
    hhPeriodo: number;
    recursos: string[];
    recursosIds?: string[];
    horasPorRecurso?: { [recursoId: string]: number };
    fechaInicio: string;
    fechaTermino: string;
    contraparte: string;
    estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
    avance: number;
    hhPlanificadas: number;
    hhReal: number;
    alertas: string;
    acciones: string;
    responsable: string;
    responsableId?: string;
    bitacora: Array<{
        fecha: string;
        descripcion: string;
    }>;
    created_at?: string;
    updated_at?: string;
}

export class FichaModel {
    static async create(data: Partial<Ficha>): Promise<Ficha> {
        const db = await getDatabase();

        // 1. Obtener o crear un Proyecto asociado en la tabla Proyectos si no existe
        let proyectoId: number;
        
        // Buscar por nombre de proyecto
        const existingProj = await db.request()
            .input('NombreProyecto', sql.NVarChar, data.nombreProyecto)
            .query('SELECT Id FROM Proyectos WHERE NombreProyecto = @NombreProyecto');
        
        if (existingProj.recordset.length > 0) {
            proyectoId = existingProj.recordset[0].Id;
            // Sincronizar el estado del proyecto existente con el de la nueva ficha
            await db.request()
                .input('Id', sql.Int, proyectoId)
                .input('Estado', sql.NVarChar, data.estado || 'No Iniciada')
                .query('UPDATE Proyectos SET Estado = @Estado, FechaActualizacion = GETDATE() WHERE Id = @Id');
        } else {
            // Crear Proyecto
            const code = `FCH-${Math.floor(1000 + Math.random() * 9000)}`;
            const createProj = await db.request()
                .input('Codigo', sql.NVarChar, code)
                .input('NombreProyecto', sql.NVarChar, data.nombreProyecto)
                .input('Cliente', sql.NVarChar, data.cliente || '')
                .input('Lider', sql.NVarChar, data.lider || '')
                .input('Estado', sql.NVarChar, data.estado || 'No Iniciada')
                .input('Venta', sql.Decimal(18, 2), data.venta || 0)
                .input('HHPlanificadas', sql.Decimal(10, 2), data.hhPlanificadas || 0)
                .input('HHReal', sql.Decimal(10, 2), data.hhReal || 0)
                .input('FechaInicio', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
                .input('FechaFin', sql.Date, data.fechaTermino ? new Date(data.fechaTermino) : null)
                .input('Descripcion', sql.NVarChar, data.descripcion || '')
                .query(`
                    INSERT INTO Proyectos (Codigo, NombreProyecto, Cliente, Lider, Estado, Avance, Venta, HHPlanificadas, HHReal, FechaInicio, FechaFin, Descripcion, FechaCreacion)
                    VALUES (@Codigo, @NombreProyecto, @Cliente, @Lider, @Estado, @HHPlanificadas, @Venta, @HHPlanificadas, @HHReal, @FechaInicio, @FechaFin, @Descripcion, GETDATE());
                    SELECT SCOPE_IDENTITY() AS Id;
                `);
            proyectoId = createProj.recordset[0].Id;
        }

        // 2. Crear Ficha en FichasProyecto
        const result = await db.request()
            .input('ProyectoId', sql.Int, proyectoId)
            .input('NombreProyecto', sql.NVarChar, data.nombreProyecto)
            .input('HHImplementacion', sql.Decimal(10, 2), data.hhImplementacion || 0)
            .input('HHPeriodo', sql.Decimal(10, 2), data.hhPeriodo || 0)
            .input('HHPlanificadas', sql.Decimal(10, 2), data.hhPlanificadas || 0)
            .input('HHReal', sql.Decimal(10, 2), data.hhReal || 0)
            .input('Estado', sql.NVarChar, data.estado || 'Activa')
            .input('FechaInicio', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
            .input('FechaFin', sql.Date, data.fechaTermino ? new Date(data.fechaTermino) : null)
            .input('Descripcion', sql.NVarChar, data.descripcion || '')
            .query(`
                INSERT INTO FichasProyecto (ProyectoId, NombreProyecto, HHImplementacion, HHPeriodo, HHPlanificadas, HHReal, Estado, FechaInicio, FechaFin, Descripcion, FechaCreacion)
                VALUES (@ProyectoId, @NombreProyecto, @HHImplementacion, @HHPeriodo, @HHPlanificadas, @HHReal, @Estado, @FechaInicio, @FechaFin, @Descripcion, GETDATE());
                SELECT SCOPE_IDENTITY() AS Id;
            `);

        const newFichaId = result.recordset[0].Id;

        // 3. Guardar recursos asignados
        if (data.recursosIds && data.horasPorRecurso) {
            for (const rId of data.recursosIds) {
                const horas = data.horasPorRecurso[rId] || 0;
                await db.request()
                    .input('FichaId', sql.Int, newFichaId)
                    .input('ProfesionalId', sql.Int, Number(rId))
                    .input('HorasAsignadas', sql.Decimal(10, 2), horas)
                    .query(`
                        INSERT INTO FichasRecursos (FichaId, ProfesionalId, HorasAsignadas, FechaAsignacion)
                        VALUES (@FichaId, @ProfesionalId, @HorasAsignadas, GETDATE())
                    `);
            }

            // Sincronizar con ProyectosAsignados (SolicitudesProyecto)
            try {
                const solicitudResult = await db.request()
                    .input('NombreProyecto', sql.NVarChar, data.nombreProyecto)
                    .query('SELECT Id FROM SolicitudesProyecto WHERE NombreProyecto = @NombreProyecto');
                
                const solicitudId = solicitudResult.recordset[0]?.Id;
                if (solicitudId) {
                    // Eliminar asignaciones existentes en la solicitud
                    await db.request()
                        .input('SolicitudId', sql.Int, solicitudId)
                        .query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @SolicitudId');
                    
                    // Insertar las nuevas asignaciones
                    for (const rId of data.recursosIds) {
                        const horas = data.horasPorRecurso[rId] || 0;
                        await db.request()
                            .input('SolicitudId', sql.Int, solicitudId)
                            .input('ProfesionalId', sql.Int, Number(rId))
                            .input('EstimacionHoras', sql.Decimal(10, 2), horas)
                            .input('FechaInicioEstimada', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
                            .input('FechaFinEstimada', sql.Date, data.fechaTermino ? new Date(data.fechaTermino) : null)
                            .query(`
                                INSERT INTO ProyectosAsignados (SolicitudId, ProfesionalId, EstimacionHoras, FechaInicioEstimada, FechaFinEstimada, FechaAsignacion, Estado)
                                VALUES (@SolicitudId, @ProfesionalId, @EstimacionHoras, @FechaInicioEstimada, @FechaFinEstimada, GETDATE(), 'Asignado')
                            `);
                    }
                }
            } catch (syncError) {
                console.error('Error al sincronizar asignaciones al crear ficha:', syncError);
            }
        }

        // 4. Sincronizar responsable con SolicitudesProyecto
        if (data.responsable && data.nombreProyecto) {
            await db.request()
                .input('NombreProyecto', sql.NVarChar, data.nombreProyecto)
                .input('Responsable', sql.NVarChar, data.responsable)
                .query(`
                    UPDATE SolicitudesProyecto 
                    SET NombreResponsableProyecto = @Responsable 
                    WHERE NombreProyecto = @NombreProyecto
                `);
        }

        const ficha = await this.findById(newFichaId);
        if (!ficha) {
            throw new Error('Error al crear la ficha');
        }
        return ficha;
    }

    static async findById(id: string | number): Promise<Ficha | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query(`
                SELECT f.*, p.Codigo, p.Cliente, p.Lider, p.Venta, p.Avance, p.Estado AS EstadoProyecto,
                       s.NombreResponsableProyecto
                FROM FichasProyecto f
                INNER JOIN Proyectos p ON f.ProyectoId = p.Id
                LEFT JOIN SolicitudesProyecto s ON f.NombreProyecto = s.NombreProyecto
                WHERE f.Id = @Id
            `);

        const ficha = result.recordset[0];
        if (!ficha) return undefined;

        return this.parseFicha(ficha);
    }

    static async findAll(): Promise<Ficha[]> {
        const db = await getDatabase();
        const result = await db.request().query(`
            SELECT f.*, p.Codigo, p.Cliente, p.Lider, p.Venta, p.Avance, p.Estado AS EstadoProyecto,
                   s.NombreResponsableProyecto
            FROM FichasProyecto f
            INNER JOIN Proyectos p ON f.ProyectoId = p.Id
            LEFT JOIN SolicitudesProyecto s ON f.NombreProyecto = s.NombreProyecto
            ORDER BY f.FechaCreacion DESC
        `);
        
        const list: Ficha[] = [];
        for (const f of result.recordset) {
            list.push(await this.parseFicha(f));
        }
        return list;
    }

    static async update(id: string | number, data: Partial<Ficha>): Promise<Ficha> {
        const db = await getDatabase();
        const fichaId = Number(id);

        const fichaActual = await this.findById(fichaId);
        if (!fichaActual) {
            throw new Error('Ficha no encontrada');
        }

        const fields: string[] = [];
        const request = db.request();

        if (data.nombreProyecto) {
            fields.push('NombreProyecto = @NombreProyecto');
            request.input('NombreProyecto', sql.NVarChar, data.nombreProyecto);
        }
        if (data.hhImplementacion !== undefined) {
            fields.push('HHImplementacion = @HHImplementacion');
            request.input('HHImplementacion', sql.Decimal(10, 2), data.hhImplementacion);
        }
        if (data.hhPeriodo !== undefined) {
            fields.push('HHPeriodo = @HHPeriodo');
            request.input('HHPeriodo', sql.Decimal(10, 2), data.hhPeriodo);
        }
        if (data.hhPlanificadas !== undefined) {
            fields.push('HHPlanificadas = @HHPlanificadas');
            request.input('HHPlanificadas', sql.Decimal(10, 2), data.hhPlanificadas);
        }
        if (data.hhReal !== undefined) {
            fields.push('HHReal = @HHReal');
            request.input('HHReal', sql.Decimal(10, 2), data.hhReal);
        }
        if (data.estado) {
            fields.push('Estado = @Estado');
            request.input('Estado', sql.NVarChar, data.estado);
        }
        if (data.fechaInicio !== undefined) {
            fields.push('FechaInicio = @FechaInicio');
            request.input('FechaInicio', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null);
        }
        if (data.fechaTermino !== undefined) {
            fields.push('FechaFin = @FechaFin');
            request.input('FechaFin', sql.Date, data.fechaTermino ? new Date(data.fechaTermino) : null);
        }
        if (data.descripcion !== undefined) {
            fields.push('Descripcion = @Descripcion');
            request.input('Descripcion', sql.NVarChar, data.descripcion);
        }

        if (fields.length > 0) {
            request.input('Id', sql.Int, fichaId);
            await request.query(`
                UPDATE FichasProyecto 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        }

        // Si se actualizan recursos asignados
        if (data.recursosIds && data.horasPorRecurso) {
            // Eliminar asignaciones actuales
            await db.request()
                .input('FichaId', sql.Int, fichaId)
                .query('DELETE FROM FichasRecursos WHERE FichaId = @FichaId');

            // Insertar nuevas
            for (const rId of data.recursosIds) {
                const horas = data.horasPorRecurso[rId] || 0;
                await db.request()
                    .input('FichaId', sql.Int, fichaId)
                    .input('ProfesionalId', sql.Int, Number(rId))
                    .input('HorasAsignadas', sql.Decimal(10, 2), horas)
                    .query(`
                        INSERT INTO FichasRecursos (FichaId, ProfesionalId, HorasAsignadas, FechaAsignacion)
                        VALUES (@FichaId, @ProfesionalId, @HorasAsignadas, GETDATE())
                    `);
            }

            // Sincronizar con ProyectosAsignados (SolicitudesProyecto)
            try {
                const nombreProyecto = data.nombreProyecto || (fichaActual && fichaActual.nombreProyecto);
                if (nombreProyecto) {
                    const solicitudResult = await db.request()
                        .input('NombreProyecto', sql.NVarChar, nombreProyecto)
                        .query('SELECT Id FROM SolicitudesProyecto WHERE NombreProyecto = @NombreProyecto');
                    
                    const solicitudId = solicitudResult.recordset[0]?.Id;
                    if (solicitudId) {
                        // Eliminar asignaciones existentes en la solicitud
                        await db.request()
                            .input('SolicitudId', sql.Int, solicitudId)
                            .query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @SolicitudId');
                        
                        // Insertar las nuevas asignaciones
                        for (const rId of data.recursosIds) {
                            const horas = data.horasPorRecurso[rId] || 0;
                            const fechaInicio = data.fechaInicio !== undefined ? data.fechaInicio : (fichaActual && fichaActual.fechaInicio);
                            const fechaTermino = data.fechaTermino !== undefined ? data.fechaTermino : (fichaActual && fichaActual.fechaTermino);
                            
                            await db.request()
                                .input('SolicitudId', sql.Int, solicitudId)
                                .input('ProfesionalId', sql.Int, Number(rId))
                                .input('EstimacionHoras', sql.Decimal(10, 2), horas)
                                .input('FechaInicioEstimada', sql.Date, fechaInicio ? new Date(fechaInicio) : null)
                                .input('FechaFinEstimada', sql.Date, fechaTermino ? new Date(fechaTermino) : null)
                                .query(`
                                    INSERT INTO ProyectosAsignados (SolicitudId, ProfesionalId, EstimacionHoras, FechaInicioEstimada, FechaFinEstimada, FechaAsignacion, Estado)
                                    VALUES (@SolicitudId, @ProfesionalId, @EstimacionHoras, @FechaInicioEstimada, @FechaFinEstimada, GETDATE(), 'Asignado')
                                `);
                        }
                    }
                }
            } catch (syncError) {
                console.error('Error al sincronizar asignaciones con solicitud en actualización:', syncError);
            }
        }

        // Sincronizar campos principales en Proyectos
        const updatedFicha = await this.findById(fichaId);
        if (updatedFicha && updatedFicha.nombreProyecto) {
            const projectFields: string[] = [];
            const projRequest = db.request();

            if (data.nombreProyecto) {
                projectFields.push('NombreProyecto = @NombreProyecto');
                projRequest.input('NombreProyecto', sql.NVarChar, data.nombreProyecto);
            }
            if (data.cliente) {
                projectFields.push('Cliente = @Cliente');
                projRequest.input('Cliente', sql.NVarChar, data.cliente);
            }
            if (data.lider) {
                projectFields.push('Lider = @Lider');
                projRequest.input('Lider', sql.NVarChar, data.lider);
            }
            if (data.venta !== undefined) {
                projectFields.push('Venta = @Venta');
                projRequest.input('Venta', sql.Decimal(18, 2), data.venta);
            }
            if (data.avance !== undefined) {
                projectFields.push('Avance = @Avance');
                projRequest.input('Avance', sql.Decimal(5, 2), data.avance);
            }
            if (data.estado) {
                projectFields.push('Estado = @Estado');
                projRequest.input('Estado', sql.NVarChar, data.estado);
            }

            if (projectFields.length > 0) {
                // Obtener ProyectoId
                const projInfo = await db.request()
                    .input('FichaId', sql.Int, fichaId)
                    .query('SELECT ProyectoId FROM FichasProyecto WHERE Id = @FichaId');
                
                const pId = projInfo.recordset[0]?.ProyectoId;
                if (pId) {
                    projRequest.input('Id', sql.Int, pId);
                    await projRequest.query(`
                        UPDATE Proyectos 
                        SET ${projectFields.join(', ')}, FechaActualizacion = GETDATE() 
                        WHERE Id = @Id
                    `);
                }
            }
        }

        // Sincronizar responsable con SolicitudesProyecto
        if (data.responsable && (data.nombreProyecto || (updatedFicha && updatedFicha.nombreProyecto))) {
            const nombreProyecto = data.nombreProyecto || (updatedFicha && updatedFicha.nombreProyecto);
            await db.request()
                .input('NombreProyecto', sql.NVarChar, nombreProyecto)
                .input('Responsable', sql.NVarChar, data.responsable)
                .query(`
                    UPDATE SolicitudesProyecto 
                    SET NombreResponsableProyecto = @Responsable 
                    WHERE NombreProyecto = @NombreProyecto
                `);
        }

        const updated = await this.findById(fichaId);
        if (!updated) {
            throw new Error('Ficha no encontrada');
        }
        return updated;
    }

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        const fId = Number(id);

        // Obtener el nombre del proyecto antes de borrar la ficha
        const fichaResult = await db.request()
            .input('Id', sql.Int, fId)
            .query('SELECT NombreProyecto FROM FichasProyecto WHERE Id = @Id');
        const nombreProyecto = fichaResult.recordset[0]?.NombreProyecto;

        // Borrar recursos primero
        await db.request().input('FichaId', sql.Int, fId).query('DELETE FROM FichasRecursos WHERE FichaId = @FichaId');

        // Borrar ficha
        await db.request()
            .input('Id', sql.Int, fId)
            .query('DELETE FROM FichasProyecto WHERE Id = @Id');

        // Borrar de ProyectosAsignados si hay una solicitud vinculada
        if (nombreProyecto) {
            try {
                const solicitudResult = await db.request()
                    .input('NombreProyecto', sql.NVarChar, nombreProyecto)
                    .query('SELECT Id FROM SolicitudesProyecto WHERE NombreProyecto = @NombreProyecto');
                const solicitudId = solicitudResult.recordset[0]?.Id;
                if (solicitudId) {
                    await db.request()
                        .input('SolicitudId', sql.Int, solicitudId)
                        .query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @SolicitudId');
                }
            } catch (err) {
                console.error('Error al limpiar ProyectosAsignados al borrar ficha:', err);
            }
        }
    }

    private static async parseFicha(f: any): Promise<Ficha> {
        const db = await getDatabase();
        
        // Obtener recursos asignados en FichasRecursos
        const resourcesResult = await db.request()
            .input('fichaId', sql.Int, f.Id)
            .query(`
                SELECT r.ProfesionalId, p.Nombre, r.HorasAsignadas 
                FROM FichasRecursos r
                INNER JOIN Profesionales p ON r.ProfesionalId = p.Id
                WHERE r.FichaId = @fichaId
            `);
        
        const recursos: string[] = [];
        const recursosIds: string[] = [];
        const horasPorRecurso: { [recursoId: string]: number } = {};
        
        resourcesResult.recordset.forEach((r: any) => {
            recursos.push(r.Nombre);
            recursosIds.push(String(r.ProfesionalId));
            horasPorRecurso[String(r.ProfesionalId)] = Number(r.HorasAsignadas || 0);
        });

        return {
            id: String(f.Id),
            codigo: f.Codigo || `FCH-${f.Id}`,
            nombreProyecto: f.NombreProyecto,
            cliente: f.Cliente || 'No especificado',
            lider: f.Lider || 'No especificado',
            liderId: undefined,
            descripcion: f.Descripcion || '',
            tecnologias: '',
            venta: Number(f.Venta || 0),
            hhImplementacion: Number(f.HHImplementacion || 0),
            hhPeriodo: Number(f.HHPeriodo || 0),
            recursos: recursos,
            recursosIds: recursosIds,
            horasPorRecurso: horasPorRecurso,
            fechaInicio: f.FechaInicio ? new Date(f.FechaInicio).toISOString().split('T')[0] : '',
            fechaTermino: f.FechaFin ? new Date(f.FechaFin).toISOString().split('T')[0] : '',
            contraparte: '',
            estado: f.EstadoProyecto || f.Estado || 'No Iniciada',
            avance: Number(f.Avance || 0),
            hhPlanificadas: Number(f.HHPlanificadas || 0),
            hhReal: Number(f.HHReal || 0),
            alertas: '',
            acciones: '',
            responsable: f.NombreResponsableProyecto || '',
            responsableId: undefined,
            bitacora: [],
            created_at: f.FechaCreacion ? new Date(f.FechaCreacion).toISOString() : undefined,
            updated_at: f.FechaActualizacion ? new Date(f.FechaActualizacion).toISOString() : undefined
        };
    }
}
export default FichaModel;
