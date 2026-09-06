import { getDatabase } from '../database/database';
import sql from 'mssql';
import FichaModel from './Ficha';

export interface DemandaData {
    id: string;
    codigo?: string;
    proyecto: string;
    tipoProyecto: 'Interno' | 'Externo';
    fechaSolicitud?: string;
    area: string;
    responsableTI: string;
    estado: string;
    decisionComite?: string;
    prioridad: string;
    semaforo?: string;
    etapa: string;
    fechaComite?: string;
    planificacionEstimada: string;
    planificacionReal: string;
    fechaEstimadaEntrega: string;
    fechaEntregaReal?: string;
    tiempoEstimadoCompleto?: string;
    tiempoEstimadoAjuste?: string;
    solicitante?: string;
    observaciones?: string;
    created_at?: string;
    updated_at?: string;
}

export class GestionDemandaModel {
    static async create(data: Partial<DemandaData>): Promise<DemandaData> {
        const db = await getDatabase();

        const result = await db.request()
            .input('Codigo', sql.NVarChar, data.codigo || '')
            .input('Proyecto', sql.NVarChar, data.proyecto || '')
            .input('TipoProyecto', sql.NVarChar, data.tipoProyecto || 'Interno')
            .input('FechaSolicitud', sql.Date, data.fechaSolicitud ? new Date(data.fechaSolicitud) : null)
            .input('Area', sql.NVarChar, data.area || '')
            .input('ResponsableTI', sql.NVarChar, data.responsableTI || '')
            .input('Estado', sql.NVarChar, data.estado || 'Solicitud')
            .input('DecisionComite', sql.NVarChar, data.decisionComite || 'Pendiente')
            .input('Prioridad', sql.NVarChar, data.prioridad || 'Media')
            .input('Semaforo', sql.NVarChar, data.semaforo || 'Verde')
            .input('Etapa', sql.NVarChar, data.etapa || 'Ingreso')
            .input('FechaComite', sql.Date, data.fechaComite ? new Date(data.fechaComite) : null)
            .input('PlanificacionEstimada', sql.NVarChar, data.planificacionEstimada || '')
            .input('PlanificacionReal', sql.NVarChar, data.planificacionReal || '')
            .input('FechaEstimadaEntrega', sql.Date, data.fechaEstimadaEntrega ? new Date(data.fechaEstimadaEntrega) : null)
            .input('FechaEntregaReal', sql.Date, data.fechaEntregaReal ? new Date(data.fechaEntregaReal) : null)
            .input('TiempoEstimadoCompleto', sql.NVarChar, data.tiempoEstimadoCompleto || '')
            .input('TiempoEstimadoAjuste', sql.NVarChar, data.tiempoEstimadoAjuste || '')
            .input('Solicitante', sql.NVarChar, data.solicitante || '')
            .input('Observaciones', sql.NVarChar, data.observaciones || '')
            .query(`
                INSERT INTO GestionDemanda (
                    Codigo, Proyecto, TipoProyecto, FechaSolicitud, Area, ResponsableTI, Estado, DecisionComite, Prioridad,
                    Semaforo, Etapa, FechaComite, PlanificacionEstimada, PlanificacionReal, FechaEstimadaEntrega,
                    FechaEntregaReal, TiempoEstimadoCompleto, TiempoEstimadoAjuste, Solicitante, Observaciones, FechaCreacion
                )
                VALUES (
                    @Codigo, @Proyecto, @TipoProyecto, @FechaSolicitud, @Area, @ResponsableTI, @Estado, @DecisionComite, @Prioridad,
                    @Semaforo, @Etapa, @FechaComite, @PlanificacionEstimada, @PlanificacionReal, @FechaEstimadaEntrega,
                    @FechaEntregaReal, @TiempoEstimadoCompleto, @TiempoEstimadoAjuste, @Solicitante, @Observaciones, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS Id;
            `);

        const newId = result.recordset[0].Id;
        const created = await this.findById(newId);
        if (!created) throw new Error('Error al crear el registro de demanda');

        return created;
    }

    static async findById(id: string | number): Promise<DemandaData | null> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query('SELECT * FROM GestionDemanda WHERE Id = @Id');

        if (result.recordset.length === 0) return null;
        return this.parseDemanda(result.recordset[0]);
    }

    static async findAll(): Promise<DemandaData[]> {
        const db = await getDatabase();
        const result = await db.request().query('SELECT * FROM GestionDemanda ORDER BY FechaCreacion DESC');
        return result.recordset.map(row => this.parseDemanda(row));
    }

    static async update(id: string | number, data: Partial<DemandaData>): Promise<DemandaData> {
        const db = await getDatabase();
        const fields: string[] = [];
        const request = db.request();

        const mappings: { [key: string]: { col: string; type: any } } = {
            codigo: { col: 'Codigo', type: sql.NVarChar },
            proyecto: { col: 'Proyecto', type: sql.NVarChar },
            tipoProyecto: { col: 'TipoProyecto', type: sql.NVarChar },
            fechaSolicitud: { col: 'FechaSolicitud', type: sql.Date },
            area: { col: 'Area', type: sql.NVarChar },
            responsableTI: { col: 'ResponsableTI', type: sql.NVarChar },
            estado: { col: 'Estado', type: sql.NVarChar },
            decisionComite: { col: 'DecisionComite', type: sql.NVarChar },
            prioridad: { col: 'Prioridad', type: sql.NVarChar },
            semaforo: { col: 'Semaforo', type: sql.NVarChar },
            etapa: { col: 'Etapa', type: sql.NVarChar },
            fechaComite: { col: 'FechaComite', type: sql.Date },
            planificacionEstimada: { col: 'PlanificacionEstimada', type: sql.NVarChar },
            planificacionReal: { col: 'PlanificacionReal', type: sql.NVarChar },
            fechaEstimadaEntrega: { col: 'FechaEstimadaEntrega', type: sql.Date },
            fechaEntregaReal: { col: 'FechaEntregaReal', type: sql.Date },
            tiempoEstimadoCompleto: { col: 'TiempoEstimadoCompleto', type: sql.NVarChar },
            tiempoEstimadoAjuste: { col: 'TiempoEstimadoAjuste', type: sql.NVarChar },
            solicitante: { col: 'Solicitante', type: sql.NVarChar },
            observaciones: { col: 'Observaciones', type: sql.NVarChar }
        };

        Object.keys(mappings).forEach(key => {
            const val = (data as any)[key];
            if (val !== undefined) {
                const mapping = mappings[key];
                fields.push(`${mapping.col} = @${mapping.col}`);
                if (mapping.type === sql.Date) {
                    request.input(mapping.col, mapping.type, val ? new Date(val) : null);
                } else {
                    request.input(mapping.col, mapping.type, val);
                }
            }
        });

        if (fields.length > 0) {
            request.input('Id', sql.Int, Number(id));
            await request.query(`
                UPDATE GestionDemanda
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE()
                WHERE Id = @Id
            `);
        }

        if (data.etapa) {
            try {
                const currentDemanda = await this.findById(id);
                if (currentDemanda) {
                    const code = data.codigo || currentDemanda.codigo;
                    const projName = data.proyecto || currentDemanda.proyecto;
                    await db.request()
                        .input('Etapa', sql.NVarChar, data.etapa)
                        .input('Codigo', sql.NVarChar, code || '')
                        .input('Proyecto', sql.NVarChar, projName || '')
                        .query(`
                            UPDATE fp
                            SET fp.EtapaLifecycle = @Etapa, fp.FechaActualizacion = GETDATE()
                            FROM FichasProyecto fp
                            INNER JOIN Proyectos p ON fp.ProyectoId = p.Id
                            WHERE (p.Codigo = @Codigo AND @Codigo <> '')
                               OR LOWER(LTRIM(RTRIM(p.NombreProyecto))) = LOWER(LTRIM(RTRIM(@Proyecto)));

                            UPDATE Proyectos
                            SET EtapaLifecycle = @Etapa, FechaActualizacion = GETDATE()
                            WHERE (Codigo = @Codigo AND @Codigo <> '')
                               OR LOWER(LTRIM(RTRIM(NombreProyecto))) = LOWER(LTRIM(RTRIM(@Proyecto)));
                        `);
                }
            } catch (syncErr) {
                console.error('Error al sincronizar Etapa desde Demanda a FichasProyecto:', syncErr);
            }
        }

        const updated = await this.findById(id);
        if (!updated) throw new Error('Registro de demanda no encontrado');

        return updated;
    }

    static async updatePrioridad(id: string | number, prioridad: string): Promise<DemandaData> {
        return this.update(id, { prioridad: prioridad as any });
    }

    static async updateEstado(id: string | number, estado: string): Promise<DemandaData> {
        return this.update(id, { estado: estado as any });
    }

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        await db.request()
            .input('Id', sql.Int, Number(id))
            .query('DELETE FROM GestionDemanda WHERE Id = @Id');
    }

    public static async createFichaProyectoFromDemanda(demanda: DemandaData): Promise<void> {
        const db = await getDatabase();
        const check = await db.request()
            .input('NombreProyecto', sql.NVarChar, demanda.proyecto)
            .query('SELECT Id FROM FichasProyecto WHERE NombreProyecto = @NombreProyecto');
        
        if (check.recordset.length === 0) {
            await FichaModel.create({
                nombreProyecto: demanda.proyecto,
                cliente: demanda.solicitante || demanda.area || 'No especificado',
                lider: demanda.responsableTI || 'No asignado',
                responsable: demanda.responsableTI || '',
                descripcion: demanda.observaciones || '',
                fechaInicio: demanda.planificacionReal || demanda.planificacionEstimada || new Date().toISOString().split('T')[0],
                fechaTermino: demanda.fechaEstimadaEntrega || '',
                estado: 'No Iniciada',
                avance: 0,
                venta: 0,
                hhPlanificadas: 0,
                hhReal: 0
            });
            console.log(`✅ Ficha de Proyecto creada automáticamente desde la Demanda "${demanda.proyecto}"`);
        }
    }

    private static parseDemanda(row: any): DemandaData {
        return {
            id: String(row.Id),
            codigo: row.Codigo || '',
            proyecto: row.Proyecto || '',
            tipoProyecto: (row.TipoProyecto as any) || 'Interno',
            fechaSolicitud: row.FechaSolicitud ? new Date(row.FechaSolicitud).toISOString().split('T')[0] : '',
            area: row.Area || '',
            responsableTI: row.ResponsableTI || '',
            estado: row.Estado || 'Solicitud',
            decisionComite: row.DecisionComite || 'Pendiente',
            prioridad: row.Prioridad || 'Media',
            semaforo: row.Semaforo || 'Verde',
            etapa: row.Etapa || 'Ingreso',
            fechaComite: row.FechaComite ? new Date(row.FechaComite).toISOString().split('T')[0] : '',
            planificacionEstimada: row.PlanificacionEstimada || '',
            planificacionReal: row.PlanificacionReal || '',
            fechaEstimadaEntrega: row.FechaEstimadaEntrega ? new Date(row.FechaEstimadaEntrega).toISOString().split('T')[0] : '',
            fechaEntregaReal: row.FechaEntregaReal ? new Date(row.FechaEntregaReal).toISOString().split('T')[0] : '',
            tiempoEstimadoCompleto: row.TiempoEstimadoCompleto || '',
            tiempoEstimadoAjuste: row.TiempoEstimadoAjuste || '',
            solicitante: row.Solicitante || '',
            observaciones: row.Observaciones || '',
            created_at: row.FechaCreacion ? new Date(row.FechaCreacion).toISOString() : '',
            updated_at: row.FechaActualizacion ? new Date(row.FechaActualizacion).toISOString() : ''
        };
    }
}

export default GestionDemandaModel;
