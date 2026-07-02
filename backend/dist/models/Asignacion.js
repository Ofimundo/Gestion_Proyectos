"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsignacionModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
class AsignacionModel {
    static async assign(data) {
        const db = await (0, database_1.getDatabase)();
        const sId = Number(data.solicitudId);
        const pId = Number(data.profesionalId);
        // Verificar si ya existe asignación
        const existing = await db.request()
            .input('solicitudId', mssql_1.default.Int, sId)
            .input('profesionalId', mssql_1.default.Int, pId)
            .query('SELECT * FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');
        if (existing.recordset.length > 0) {
            // Actualizar asignación existente
            await db.request()
                .input('solicitudId', mssql_1.default.Int, sId)
                .input('profesionalId', mssql_1.default.Int, pId)
                .input('estimacionHoras', mssql_1.default.Decimal(10, 2), data.estimacionHoras)
                .input('fechaInicioEstimada', mssql_1.default.Date, data.fechaInicioEstimada ? new Date(data.fechaInicioEstimada) : null)
                .input('fechaFinEstimada', mssql_1.default.Date, data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : null)
                .query(`
                    UPDATE ProyectosAsignados 
                    SET EstimacionHoras = @estimacionHoras, 
                        FechaInicioEstimada = @fechaInicioEstimada, 
                        FechaFinEstimada = @fechaFinEstimada
                    WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId
                `);
        }
        else {
            // Insertar nueva asignación
            await db.request()
                .input('solicitudId', mssql_1.default.Int, sId)
                .input('profesionalId', mssql_1.default.Int, pId)
                .input('estimacionHoras', mssql_1.default.Decimal(10, 2), data.estimacionHoras)
                .input('fechaInicioEstimada', mssql_1.default.Date, data.fechaInicioEstimada ? new Date(data.fechaInicioEstimada) : null)
                .input('fechaFinEstimada', mssql_1.default.Date, data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : null)
                .query(`
                    INSERT INTO ProyectosAsignados (SolicitudId, ProfesionalId, EstimacionHoras, FechaInicioEstimada, FechaFinEstimada, FechaAsignacion, Estado)
                    VALUES (@solicitudId, @profesionalId, @estimacionHoras, @fechaInicioEstimada, @fechaFinEstimada, GETDATE(), 'Asignado')
                `);
        }
        // Registrar en HorasAsignadasMensual (opcional, acorde a sus procedimientos almacenados)
        await this.updateHorasMensuales(pId, data.estimacionHoras);
    }
    static async remove(profesionalId, solicitudId) {
        const db = await (0, database_1.getDatabase)();
        const sId = Number(solicitudId);
        const pId = Number(profesionalId);
        // Obtener la estimación actual antes de borrar para restar
        const existing = await db.request()
            .input('solicitudId', mssql_1.default.Int, sId)
            .input('profesionalId', mssql_1.default.Int, pId)
            .query('SELECT EstimacionHoras FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');
        const estimacionHoras = existing.recordset[0]?.EstimacionHoras || 0;
        await db.request()
            .input('solicitudId', mssql_1.default.Int, sId)
            .input('profesionalId', mssql_1.default.Int, pId)
            .query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');
        // Restar en HorasAsignadasMensual
        await this.updateHorasMensuales(pId, -estimacionHoras);
    }
    static async updateHorasMensuales(profesionalId, diffHours) {
        const db = await (0, database_1.getDatabase)();
        const mes = new Date().getMonth() + 1;
        const ano = new Date().getFullYear();
        const check = await db.request()
            .input('pId', mssql_1.default.Int, profesionalId)
            .input('mes', mssql_1.default.Int, mes)
            .input('ano', mssql_1.default.Int, ano)
            .query('SELECT * FROM HorasAsignadasMensual WHERE ProfesionalId = @pId AND Mes = @mes AND Ano = @ano');
        if (check.recordset.length > 0) {
            await db.request()
                .input('pId', mssql_1.default.Int, profesionalId)
                .input('mes', mssql_1.default.Int, mes)
                .input('ano', mssql_1.default.Int, ano)
                .input('diff', mssql_1.default.Decimal(10, 2), diffHours)
                .query(`
                    UPDATE HorasAsignadasMensual 
                    SET HorasAsignadas = CASE WHEN (HorasAsignadas + @diff) < 0 THEN 0 ELSE (HorasAsignadas + @diff) END,
                        FechaActualizacion = GETDATE()
                    WHERE ProfesionalId = @pId AND Mes = @mes AND Ano = @ano
                `);
        }
        else {
            const startHours = diffHours < 0 ? 0 : diffHours;
            await db.request()
                .input('pId', mssql_1.default.Int, profesionalId)
                .input('mes', mssql_1.default.Int, mes)
                .input('ano', mssql_1.default.Int, ano)
                .input('start', mssql_1.default.Decimal(10, 2), startHours)
                .query(`
                    INSERT INTO HorasAsignadasMensual (ProfesionalId, Mes, Ano, HorasAsignadas, FechaActualizacion)
                    VALUES (@pId, @mes, @ano, @start, GETDATE())
                `);
        }
    }
}
exports.AsignacionModel = AsignacionModel;
exports.default = AsignacionModel;
//# sourceMappingURL=Asignacion.js.map