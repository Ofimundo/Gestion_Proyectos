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
            .input('Proyecto', mssql_1.default.NVarChar, data.proyecto || '')
            .input('TipoProyecto', mssql_1.default.NVarChar, data.tipoProyecto || 'Interno')
            .input('Prioridad', mssql_1.default.NVarChar, data.prioridad || 'media')
            .input('Estado', mssql_1.default.NVarChar, data.estado || 'solicitado')
            .input('Etapa', mssql_1.default.NVarChar, data.etapa || '')
            .input('Area', mssql_1.default.NVarChar, data.area || '')
            .input('PlanificacionEstimada', mssql_1.default.NVarChar, data.planificacionEstimada || '')
            .input('PlanificacionReal', mssql_1.default.NVarChar, data.planificacionReal || '')
            .input('FechaEstimadaEntrega', mssql_1.default.Date, data.fechaEstimadaEntrega ? new Date(data.fechaEstimadaEntrega) : null)
            .input('FechaEntregaReal', mssql_1.default.Date, data.fechaEntregaReal ? new Date(data.fechaEntregaReal) : null)
            .input('ResponsableTI', mssql_1.default.NVarChar, data.responsableTI || '')
            .input('Solicitante', mssql_1.default.NVarChar, data.solicitante || '')
            .input('Observaciones', mssql_1.default.NVarChar, data.observaciones || '')
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
        if (!created)
            throw new Error('Error al crear el registro de demanda');
        return created;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('SELECT * FROM GestionDemanda WHERE Id = @Id');
        const row = result.recordset[0];
        if (!row)
            return undefined;
        return this.parseDemanda(row);
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
            proyecto: { col: 'Proyecto', type: mssql_1.default.NVarChar },
            tipoProyecto: { col: 'TipoProyecto', type: mssql_1.default.NVarChar },
            prioridad: { col: 'Prioridad', type: mssql_1.default.NVarChar },
            estado: { col: 'Estado', type: mssql_1.default.NVarChar },
            etapa: { col: 'Etapa', type: mssql_1.default.NVarChar },
            area: { col: 'Area', type: mssql_1.default.NVarChar },
            planificacionEstimada: { col: 'PlanificacionEstimada', type: mssql_1.default.NVarChar },
            planificacionReal: { col: 'PlanificacionReal', type: mssql_1.default.NVarChar },
            fechaEstimadaEntrega: { col: 'FechaEstimadaEntrega', type: mssql_1.default.Date },
            fechaEntregaReal: { col: 'FechaEntregaReal', type: mssql_1.default.Date },
            responsableTI: { col: 'ResponsableTI', type: mssql_1.default.NVarChar },
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
        const updated = await this.findById(id);
        if (!updated)
            throw new Error('Registro de demanda no encontrado');
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
    static async createFichaProyectoFromDemanda(demanda) {
        const db = await (0, database_1.getDatabase)();
        const check = await db.request()
            .input('NombreProyecto', mssql_1.default.NVarChar, demanda.proyecto)
            .query('SELECT Id FROM FichasProyecto WHERE NombreProyecto = @NombreProyecto');
        if (check.recordset.length === 0) {
            await Ficha_1.default.create({
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
    static parseDemanda(row) {
        return {
            id: String(row.Id),
            proyecto: row.Proyecto || '',
            tipoProyecto: row.TipoProyecto || 'Interno',
            prioridad: row.Prioridad || 'media',
            estado: row.Estado || 'solicitado',
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
exports.GestionDemandaModel = GestionDemandaModel;
exports.default = GestionDemandaModel;
//# sourceMappingURL=GestionDemanda.js.map