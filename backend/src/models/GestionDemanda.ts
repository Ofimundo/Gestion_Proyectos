import { getDatabase } from '../database/database';
import sql from 'mssql';
import FichaModel from './Ficha';

export interface DemandaData {
    id: string;
    proyecto: string;
    tipoProyecto: 'Interno' | 'Externo';
    prioridad: 'alta' | 'media' | 'baja';
    estado: 'backlog' | 'en proceso' | 'finalizado' | 'en espera cierre del usuario' | 'solicitado' | 'ejecución aprobada';
    etapa: string;
    area: string;
    planificacionEstimada: string;
    planificacionReal: string;
    fechaEstimadaEntrega: string;
    fechaEntregaReal?: string;
    responsableTI: string;
    solicitante: string;
    observaciones?: string;
    created_at?: string;
    updated_at?: string;
}

export class GestionDemandaModel {
    static async create(data: Partial<DemandaData>): Promise<DemandaData> {
        const db = await getDatabase();

        const result = await db.request()
            .input('Proyecto', sql.NVarChar, data.proyecto || '')
            .input('TipoProyecto', sql.NVarChar, data.tipoProyecto || 'Interno')
            .input('Prioridad', sql.NVarChar, data.prioridad || 'media')
            .input('Estado', sql.NVarChar, data.estado || 'solicitado')
            .input('Etapa', sql.NVarChar, data.etapa || '')
            .input('Area', sql.NVarChar, data.area || '')
            .input('PlanificacionEstimada', sql.NVarChar, data.planificacionEstimada || '')
            .input('PlanificacionReal', sql.NVarChar, data.planificacionReal || '')
            .input('FechaEstimadaEntrega', sql.Date, data.fechaEstimadaEntrega ? new Date(data.fechaEstimadaEntrega) : null)
            .input('FechaEntregaReal', sql.Date, data.fechaEntregaReal ? new Date(data.fechaEntregaReal) : null)
            .input('ResponsableTI', sql.NVarChar, data.responsableTI || '')
            .input('Solicitante', sql.NVarChar, data.solicitante || '')
            .input('Observaciones', sql.NVarChar, data.observaciones || '')
            .query(`
                INSERT INTO GestionDemanda (
                    Proyecto, TipoProyecto, Prioridad, Estado, Etapa, Area,
                    PlanificacionEstimada, PlanificacionReal, FechaEstimadaEntrega, FechaEntregaReal,
                    ResponsableTI, Solicitante, Observaciones, FechaCreacion
                )
                VALUES (
                    @Proyecto, @TipoProyecto, @Prioridad, @Estado, @Etapa, @Area,
                    @PlanificacionEstimada, @PlanificacionReal, @FechaEstimadaEntrega, @FechaEntregaReal,
                    @ResponsableTI, @Solicitante, @Observaciones, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS Id;
            `);

        const newId = result.recordset[0].Id;
        const created = await this.findById(newId);
        if (!created) throw new Error('Error al crear el registro de demanda');

        return created;
    }

    static async findById(id: string | number): Promise<DemandaData | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query('SELECT * FROM GestionDemanda WHERE Id = @Id');

        const row = result.recordset[0];
        if (!row) return undefined;
        return this.parseDemanda(row);
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
            proyecto: { col: 'Proyecto', type: sql.NVarChar },
            tipoProyecto: { col: 'TipoProyecto', type: sql.NVarChar },
            prioridad: { col: 'Prioridad', type: sql.NVarChar },
            estado: { col: 'Estado', type: sql.NVarChar },
            etapa: { col: 'Etapa', type: sql.NVarChar },
            area: { col: 'Area', type: sql.NVarChar },
            planificacionEstimada: { col: 'PlanificacionEstimada', type: sql.NVarChar },
            planificacionReal: { col: 'PlanificacionReal', type: sql.NVarChar },
            fechaEstimadaEntrega: { col: 'FechaEstimadaEntrega', type: sql.Date },
            fechaEntregaReal: { col: 'FechaEntregaReal', type: sql.Date },
            responsableTI: { col: 'ResponsableTI', type: sql.NVarChar },
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
                descripcion: demanda.observaciones || `Creado automáticamente desde Gestión de Demanda (Área: ${demanda.area || 'General'})`,
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
            proyecto: row.Proyecto || '',
            tipoProyecto: (row.TipoProyecto as any) || 'Interno',
            prioridad: (row.Prioridad as any) || 'media',
            estado: (row.Estado as any) || 'solicitado',
            etapa: row.Etapa || '',
            area: row.Area || '',
            planificacionEstimada: row.PlanificacionEstimada || '',
            planificacionReal: row.PlanificacionReal || '',
            fechaEstimadaEntrega: row.FechaEstimadaEntrega ? new Date(row.FechaEstimadaEntrega).toISOString().split('T')[0] : '',
            fechaEntregaReal: row.FechaEntregaReal ? new Date(row.FechaEntregaReal).toISOString().split('T')[0] : '',
            responsableTI: row.ResponsableTI || '',
            solicitante: row.Solicitante || '',
            observaciones: row.Observaciones || '',
            created_at: row.FechaCreacion ? new Date(row.FechaCreacion).toISOString() : '',
            updated_at: row.FechaActualizacion ? new Date(row.FechaActualizacion).toISOString() : ''
        };
    }
}

export default GestionDemandaModel;
