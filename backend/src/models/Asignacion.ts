import { getDatabase } from '../database/database';
import sql from 'mssql';

export class AsignacionModel {
    static async assign(data: {
        solicitudId: string | number;
        profesionalId: string | number;
        estimacionHoras: number;
        fechaInicioEstimada: string;
        fechaFinEstimada: string;
    }): Promise<void> {
        const db = await getDatabase();
        const sId = Number(data.solicitudId);
        const pId = Number(data.profesionalId);

        // Verificar si ya existe asignación
        const existing = await db.request()
            .input('solicitudId', sql.Int, sId)
            .input('profesionalId', sql.Int, pId)
            .query('SELECT * FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');

        if (existing.recordset.length > 0) {
            // Actualizar asignación existente
            await db.request()
                .input('solicitudId', sql.Int, sId)
                .input('profesionalId', sql.Int, pId)
                .input('estimacionHoras', sql.Decimal(10, 2), data.estimacionHoras)
                .input('fechaInicioEstimada', sql.Date, data.fechaInicioEstimada ? new Date(data.fechaInicioEstimada) : null)
                .input('fechaFinEstimada', sql.Date, data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : null)
                .query(`
                    UPDATE ProyectosAsignados 
                    SET EstimacionHoras = @estimacionHoras, 
                        FechaInicioEstimada = @fechaInicioEstimada, 
                        FechaFinEstimada = @fechaFinEstimada
                    WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId
                `);
        } else {
            // Insertar nueva asignación
            await db.request()
                .input('solicitudId', sql.Int, sId)
                .input('profesionalId', sql.Int, pId)
                .input('estimacionHoras', sql.Decimal(10, 2), data.estimacionHoras)
                .input('fechaInicioEstimada', sql.Date, data.fechaInicioEstimada ? new Date(data.fechaInicioEstimada) : null)
                .input('fechaFinEstimada', sql.Date, data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : null)
                .query(`
                    INSERT INTO ProyectosAsignados (SolicitudId, ProfesionalId, EstimacionHoras, FechaInicioEstimada, FechaFinEstimada, FechaAsignacion, Estado)
                    VALUES (@solicitudId, @profesionalId, @estimacionHoras, @fechaInicioEstimada, @fechaFinEstimada, GETDATE(), 'Asignado')
                `);
        }

        // Registrar en HorasAsignadasMensual (opcional, acorde a sus procedimientos almacenados)
        await this.updateHorasMensuales(pId, data.estimacionHoras);
    }

    static async remove(profesionalId: string | number, solicitudId: string | number): Promise<void> {
        const db = await getDatabase();
        const sId = Number(solicitudId);
        const pId = Number(profesionalId);

        // Obtener la estimación actual antes de borrar para restar
        const existing = await db.request()
            .input('solicitudId', sql.Int, sId)
            .input('profesionalId', sql.Int, pId)
            .query('SELECT EstimacionHoras FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');

        const estimacionHoras = existing.recordset[0]?.EstimacionHoras || 0;

        await db.request()
            .input('solicitudId', sql.Int, sId)
            .input('profesionalId', sql.Int, pId)
            .query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @solicitudId AND ProfesionalId = @profesionalId');

        // Restar en HorasAsignadasMensual
        await this.updateHorasMensuales(pId, -estimacionHoras);
    }

    private static async updateHorasMensuales(profesionalId: number, diffHours: number): Promise<void> {
        const db = await getDatabase();
        const mes = new Date().getMonth() + 1;
        const ano = new Date().getFullYear();

        const check = await db.request()
            .input('pId', sql.Int, profesionalId)
            .input('mes', sql.Int, mes)
            .input('ano', sql.Int, ano)
            .query('SELECT * FROM HorasAsignadasMensual WHERE ProfesionalId = @pId AND Mes = @mes AND Ano = @ano');

        if (check.recordset.length > 0) {
            await db.request()
                .input('pId', sql.Int, profesionalId)
                .input('mes', sql.Int, mes)
                .input('ano', sql.Int, ano)
                .input('diff', sql.Decimal(10, 2), diffHours)
                .query(`
                    UPDATE HorasAsignadasMensual 
                    SET HorasAsignadas = CASE WHEN (HorasAsignadas + @diff) < 0 THEN 0 ELSE (HorasAsignadas + @diff) END,
                        FechaActualizacion = GETDATE()
                    WHERE ProfesionalId = @pId AND Mes = @mes AND Ano = @ano
                `);
        } else {
            const startHours = diffHours < 0 ? 0 : diffHours;
            await db.request()
                .input('pId', sql.Int, profesionalId)
                .input('mes', sql.Int, mes)
                .input('ano', sql.Int, ano)
                .input('start', sql.Decimal(10, 2), startHours)
                .query(`
                    INSERT INTO HorasAsignadasMensual (ProfesionalId, Mes, Ano, HorasAsignadas, FechaActualizacion)
                    VALUES (@pId, @mes, @ano, @start, GETDATE())
                `);
        }
    }
}
export default AsignacionModel;
