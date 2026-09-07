"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionDemandaModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
const Ficha_1 = __importDefault(require("./Ficha"));
class GestionDemandaModel {
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Codigo', mssql_1.default.NVarChar, data.codigo || '')
            .input('Proyecto', mssql_1.default.NVarChar, data.proyecto || '')
            .input('TipoProyecto', mssql_1.default.NVarChar, data.tipoProyecto || 'Interno')
            .input('FechaSolicitud', mssql_1.default.Date, data.fechaSolicitud ? new Date(data.fechaSolicitud) : null)
            .input('Area', mssql_1.default.NVarChar, data.area || '')
            .input('ResponsableTI', mssql_1.default.NVarChar, data.responsableTI || '')
            .input('Estado', mssql_1.default.NVarChar, data.estado || 'Solicitud')
            .input('DecisionComite', mssql_1.default.NVarChar, data.decisionComite || 'Pendiente')
            .input('Prioridad', mssql_1.default.NVarChar, data.prioridad || 'Media')
            .input('Semaforo', mssql_1.default.NVarChar, data.semaforo || 'Verde')
            .input('Etapa', mssql_1.default.NVarChar, data.etapa || 'Ingreso')
            .input('FechaComite', mssql_1.default.Date, data.fechaComite ? new Date(data.fechaComite) : null)
            .input('PlanificacionEstimada', mssql_1.default.NVarChar, data.planificacionEstimada || '')
            .input('PlanificacionReal', mssql_1.default.NVarChar, data.planificacionReal || '')
            .input('FechaEstimadaEntrega', mssql_1.default.Date, data.fechaEstimadaEntrega ? new Date(data.fechaEstimadaEntrega) : null)
            .input('FechaEntregaReal', mssql_1.default.Date, data.fechaEntregaReal ? new Date(data.fechaEntregaReal) : null)
            .input('TiempoEstimadoCompleto', mssql_1.default.NVarChar, data.tiempoEstimadoCompleto || '')
            .input('TiempoEstimadoAjuste', mssql_1.default.NVarChar, data.tiempoEstimadoAjuste || '')
            .input('Solicitante', mssql_1.default.NVarChar, data.solicitante || '')
            .input('Observaciones', mssql_1.default.NVarChar, data.observaciones || '')
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
        if (!created)
            throw new Error('Error al crear el registro de demanda');
        // Si la demanda se crea ya aprobada, generar la Ficha de Proyecto
        if (this.isDemandaAprobada(created)) {
            try {
                await this.createFichaProyectoFromDemanda(created);
            }
            catch (fichaErr) {
                console.error('Error al crear Ficha de Proyecto en creación de Demanda:', fichaErr);
            }
        }
        return created;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('SELECT * FROM GestionDemanda WHERE Id = @Id');
        if (result.recordset.length === 0)
            return null;
        return this.parseDemanda(result.recordset[0]);
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query('SELECT * FROM GestionDemanda ORDER BY FechaCreacion DESC');
        return result.recordset.map(row => this.parseDemanda(row));
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const fields = [];
        const request = db.request();
        const mappings = {
            codigo: { col: 'Codigo', type: mssql_1.default.NVarChar },
            proyecto: { col: 'Proyecto', type: mssql_1.default.NVarChar },
            tipoProyecto: { col: 'TipoProyecto', type: mssql_1.default.NVarChar },
            fechaSolicitud: { col: 'FechaSolicitud', type: mssql_1.default.Date },
            area: { col: 'Area', type: mssql_1.default.NVarChar },
            responsableTI: { col: 'ResponsableTI', type: mssql_1.default.NVarChar },
            estado: { col: 'Estado', type: mssql_1.default.NVarChar },
            decisionComite: { col: 'DecisionComite', type: mssql_1.default.NVarChar },
            prioridad: { col: 'Prioridad', type: mssql_1.default.NVarChar },
            semaforo: { col: 'Semaforo', type: mssql_1.default.NVarChar },
            etapa: { col: 'Etapa', type: mssql_1.default.NVarChar },
            fechaComite: { col: 'FechaComite', type: mssql_1.default.Date },
            planificacionEstimada: { col: 'PlanificacionEstimada', type: mssql_1.default.NVarChar },
            planificacionReal: { col: 'PlanificacionReal', type: mssql_1.default.NVarChar },
            fechaEstimadaEntrega: { col: 'FechaEstimadaEntrega', type: mssql_1.default.Date },
            fechaEntregaReal: { col: 'FechaEntregaReal', type: mssql_1.default.Date },
            tiempoEstimadoCompleto: { col: 'TiempoEstimadoCompleto', type: mssql_1.default.NVarChar },
            tiempoEstimadoAjuste: { col: 'TiempoEstimadoAjuste', type: mssql_1.default.NVarChar },
            solicitante: { col: 'Solicitante', type: mssql_1.default.NVarChar },
            observaciones: { col: 'Observaciones', type: mssql_1.default.NVarChar }
        };
        Object.keys(mappings).forEach(key => {
            const val = data[key];
            if (val !== undefined) {
                const mapping = mappings[key];
                fields.push(`${mapping.col} = @${mapping.col}`);
                if (mapping.type === mssql_1.default.Date) {
                    request.input(mapping.col, mapping.type, val ? new Date(val) : null);
                }
                else {
                    request.input(mapping.col, mapping.type, val);
                }
            }
        });
        if (fields.length > 0) {
            request.input('Id', mssql_1.default.Int, Number(id));
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
                        .input('Etapa', mssql_1.default.NVarChar, data.etapa)
                        .input('Codigo', mssql_1.default.NVarChar, code || '')
                        .input('Proyecto', mssql_1.default.NVarChar, projName || '')
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
            }
            catch (syncErr) {
                console.error('Error al sincronizar Etapa desde Demanda a FichasProyecto:', syncErr);
            }
        }
        const updated = await this.findById(id);
        if (!updated)
            throw new Error('Registro de demanda no encontrado');
        // Si la demanda pasa a estar Aprobada, crear la Ficha de Proyecto automáticamente
        if (this.isDemandaAprobada(updated)) {
            try {
                await this.createFichaProyectoFromDemanda(updated);
            }
            catch (fichaErr) {
                console.error('Error al crear Ficha de Proyecto tras aprobar Demanda:', fichaErr);
            }
        }
        return updated;
    }
    static async updatePrioridad(id, prioridad) {
        return this.update(id, { prioridad: prioridad });
    }
    static async updateEstado(id, estado) {
        return this.update(id, { estado: estado });
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('DELETE FROM GestionDemanda WHERE Id = @Id');
    }
    static isDemandaAprobada(demanda) {
        const est = (demanda.estado || '').trim().toLowerCase();
        const dec = (demanda.decisionComite || '').trim().toLowerCase();
        return est === 'aprobado' || est === 'ejecución aprobada' || est === 'aprobada' || dec === 'aprobado' || dec === 'aprobada';
    }
    static async createFichaProyectoFromDemanda(demanda) {
        const db = await (0, database_1.getDatabase)();
        const check = await db.request()
            .input('NombreProyecto', mssql_1.default.NVarChar, demanda.proyecto || '')
            .input('Codigo', mssql_1.default.NVarChar, demanda.codigo || '')
            .query(`
                SELECT f.Id 
                FROM FichasProyecto f
                INNER JOIN Proyectos p ON f.ProyectoId = p.Id
                WHERE (f.NombreProyecto IS NOT NULL AND LOWER(LTRIM(RTRIM(f.NombreProyecto))) = LOWER(LTRIM(RTRIM(@NombreProyecto))))
                   OR (p.Codigo IS NOT NULL AND p.Codigo <> '' AND p.Codigo = @Codigo)
            `);
        if (check.recordset.length === 0) {
            await Ficha_1.default.create({
                codigo: (demanda.codigo && !demanda.codigo.startsWith('DEM-')) ? demanda.codigo : undefined,
                nombreProyecto: demanda.proyecto,
                cliente: demanda.solicitante || demanda.area || 'No especificado',
                lider: demanda.responsableTI || 'No asignado',
                responsable: demanda.responsableTI || '',
                descripcion: demanda.observaciones || '',
                fechaInicio: demanda.planificacionReal || demanda.planificacionEstimada || new Date().toISOString().split('T')[0],
                fechaTermino: demanda.fechaEstimadaEntrega || '',
                estado: 'No Iniciada',
                etapaLifecycle: demanda.etapa || 'Ingreso',
                avance: 0,
                venta: 0,
                hhPlanificadas: 0,
                hhReal: 0
            });
            console.log(`✅ Ficha de Proyecto creada automáticamente desde la Demanda "${demanda.proyecto}"`);
        }
    }
    static parseDemanda(row) {
        return {
            id: String(row.Id),
            codigo: row.Codigo || '',
            proyecto: row.Proyecto || '',
            tipoProyecto: row.TipoProyecto || 'Interno',
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
exports.GestionDemandaModel = GestionDemandaModel;
exports.default = GestionDemandaModel;
//# sourceMappingURL=GestionDemanda.js.map