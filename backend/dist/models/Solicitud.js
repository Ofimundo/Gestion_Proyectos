"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolicitudModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
class SolicitudModel {
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        // Generar token corto aleatorio
        const token = data.token || Math.random().toString(36).substring(2, 10).toUpperCase();
        const result = await db.request()
            .input('Token', mssql_1.default.NVarChar, token)
            .input('Email', mssql_1.default.NVarChar, data.email || null)
            .input('NombreSolicitante', mssql_1.default.NVarChar, data.nombreSolicitante || '')
            .input('Area', mssql_1.default.NVarChar, data.area || '')
            .input('GerenteSponsor', mssql_1.default.NVarChar, data.gerenteSponsor || '')
            .input('NombreProyecto', mssql_1.default.NVarChar, data.nombreProyecto || '')
            .input('ObjetivoGeneral', mssql_1.default.NVarChar, data.objetivoGeneral || '')
            .input('ObjetivosEspecificos', mssql_1.default.NVarChar, data.objetivosEspecificos || '')
            .input('CoberturaAlcance', mssql_1.default.NVarChar, data.coberturaAlcance || '')
            .input('FocoEstrategico', mssql_1.default.NVarChar, data.focoEstrategico || '')
            .input('Impacto', mssql_1.default.NVarChar, data.impacto || '')
            .input('TieneSustentoLegal', mssql_1.default.Bit, data.tieneSustentoLegal ? 1 : 0)
            .input('SustentoLegalCual', mssql_1.default.NVarChar, data.sustentoLegalCual || '')
            .input('TieneRequisitoFecha', mssql_1.default.Bit, data.tieneRequisitoFecha ? 1 : 0)
            .input('RequisitoFechaCual', mssql_1.default.NVarChar, data.requisitoFechaCual || '')
            .input('RequisitoFechaPorque', mssql_1.default.NVarChar, data.requisitoFechaPorque || '')
            .input('Observaciones', mssql_1.default.NVarChar, data.observaciones || '')
            .input('NombreResponsableProyecto', mssql_1.default.NVarChar, data.nombreResponsableProyecto || '')
            .input('Equipo', mssql_1.default.NVarChar, data.equipo || '')
            .input('NombreContraparteCliente', mssql_1.default.NVarChar, data.nombreContraparteCliente || '')
            .input('AreaContraparte', mssql_1.default.NVarChar, data.areaContraparte || '')
            .input('NombreJefaturaDirecta', mssql_1.default.NVarChar, data.nombreJefaturaDirecta || '')
            .input('DescripcionGeneral', mssql_1.default.NVarChar, data.descripcionGeneral || '')
            .input('Presupuesto', mssql_1.default.Decimal(18, 2), data.presupuesto || 0)
            .input('Tiempo', mssql_1.default.NVarChar, data.tiempo || '')
            .input('OtrasRestricciones', mssql_1.default.NVarChar, data.otrasRestricciones || '')
            .input('Riesgos', mssql_1.default.NVarChar, data.riesgos || '')
            .input('ValorDolar', mssql_1.default.Decimal(10, 2), data.valorDolar || 0)
            .input('FechaInicio', mssql_1.default.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
            .input('Estado', mssql_1.default.NVarChar, data.estado || 'Pendiente')
            .input('EsEnvioParcial', mssql_1.default.Bit, data.esEnvioParcial ? 1 : 0)
            .input('ObservacionesAdmin', mssql_1.default.NVarChar, data.observacionesAdmin || null)
            .query(`
                INSERT INTO SolicitudesProyecto (
                    Token, Email, FechaSolicitud, NombreSolicitante, Area, GerenteSponsor, NombreProyecto,
                    ObjetivoGeneral, ObjetivosEspecificos, CoberturaAlcance, FocoEstrategico, Impacto,
                    TieneSustentoLegal, SustentoLegalCual, TieneRequisitoFecha, RequisitoFechaCual, RequisitoFechaPorque,
                    Observaciones, NombreResponsableProyecto, Equipo, NombreContraparteCliente, AreaContraparte,
                    NombreJefaturaDirecta, DescripcionGeneral, Presupuesto, Tiempo, OtrasRestricciones, Riesgos,
                    ValorDolar, FechaInicio, Estado, EsEnvioParcial, ObservacionesAdmin, FechaCreacion
                ) VALUES (
                    @Token, @Email, CAST(GETDATE() AS DATE), @NombreSolicitante, @Area, @GerenteSponsor, @NombreProyecto,
                    @ObjetivoGeneral, @ObjetivosEspecificos, @CoberturaAlcance, @FocoEstrategico, @Impacto,
                    @TieneSustentoLegal, @SustentoLegalCual, @TieneRequisitoFecha, @RequisitoFechaCual, @RequisitoFechaPorque,
                    @Observaciones, @NombreResponsableProyecto, @Equipo, @NombreContraparteCliente, @AreaContraparte,
                    @NombreJefaturaDirecta, @DescripcionGeneral, @Presupuesto, @Tiempo, @OtrasRestricciones, @Riesgos,
                    @ValorDolar, @FechaInicio, @Estado, @EsEnvioParcial, @ObservacionesAdmin, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS Id;
            `);
        const newId = result.recordset[0].Id;
        const solicitud = await this.findById(newId);
        if (!solicitud) {
            throw new Error('Error al crear la solicitud');
        }
        return solicitud;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('SELECT * FROM SolicitudesProyecto WHERE Id = @Id');
        const solicitud = result.recordset[0];
        if (!solicitud)
            return undefined;
        return this.parseAndPopulateSolicitud(solicitud);
    }
    static async findByToken(token) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Token', mssql_1.default.NVarChar, token)
            .query('SELECT * FROM SolicitudesProyecto WHERE Token = @Token');
        const solicitud = result.recordset[0];
        if (!solicitud)
            return undefined;
        return this.parseAndPopulateSolicitud(solicitud);
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query('SELECT * FROM SolicitudesProyecto ORDER BY FechaCreacion DESC');
        const list = [];
        for (const s of result.recordset) {
            list.push(await this.parseAndPopulateSolicitud(s));
        }
        return list;
    }
    // ✅ MÉTODO UPDATE CORREGIDO - Guarda TODOS los campos
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        console.log('🔧 Actualizando solicitud con datos:', JSON.stringify(data, null, 2));
        // Excluir relaciones
        const updates = { ...data };
        delete updates.profesionalesAsignados;
        delete updates.estimacionHorasTotal;
        delete updates.created_at;
        delete updates.updated_at;
        const fields = [];
        const request = db.request();
        // ✅ MAPEO COMPLETO DE TODOS LOS CAMPOS
        const columnMap = {
            token: 'Token',
            email: 'Email',
            fechaSolicitud: 'FechaSolicitud',
            nombreSolicitante: 'NombreSolicitante',
            area: 'Area',
            gerenteSponsor: 'GerenteSponsor',
            nombreProyecto: 'NombreProyecto',
            objetivoGeneral: 'ObjetivoGeneral',
            objetivosEspecificos: 'ObjetivosEspecificos',
            coberturaAlcance: 'CoberturaAlcance',
            focoEstrategico: 'FocoEstrategico',
            impacto: 'Impacto',
            tieneSustentoLegal: 'TieneSustentoLegal',
            sustentoLegalCual: 'SustentoLegalCual',
            tieneRequisitoFecha: 'TieneRequisitoFecha',
            requisitoFechaCual: 'RequisitoFechaCual',
            requisitoFechaPorque: 'RequisitoFechaPorque',
            observaciones: 'Observaciones',
            nombreResponsableProyecto: 'NombreResponsableProyecto',
            equipo: 'Equipo',
            nombreContraparteCliente: 'NombreContraparteCliente',
            areaContraparte: 'AreaContraparte',
            nombreJefaturaDirecta: 'NombreJefaturaDirecta',
            descripcionGeneral: 'DescripcionGeneral',
            presupuesto: 'Presupuesto',
            tiempo: 'Tiempo',
            otrasRestricciones: 'OtrasRestricciones',
            riesgos: 'Riesgos',
            valorDolar: 'ValorDolar',
            fechaInicio: 'FechaInicio',
            estado: 'Estado',
            motivoRechazo: 'MotivoRechazo',
            fechaAprobacionRechazo: 'FechaAprobacionRechazo',
            completadoPor: 'CompletadoPor',
            fechaCompletado: 'FechaCompletado',
            esEnvioParcial: 'EsEnvioParcial',
            observacionesAdmin: 'ObservacionesAdmin'
        };
        // ✅ Recorrer todas las claves del objeto de actualización
        Object.keys(updates).forEach(key => {
            const col = columnMap[key];
            if (col) {
                fields.push(`${col} = @${col}`);
                const value = updates[key];
                // ✅ Manejar diferentes tipos de datos
                if (key === 'tieneSustentoLegal' || key === 'tieneRequisitoFecha' || key === 'esEnvioParcial') {
                    request.input(col, mssql_1.default.Bit, value ? 1 : 0);
                }
                else if (key === 'presupuesto' || key === 'valorDolar') {
                    request.input(col, mssql_1.default.Decimal(18, 2), value || 0);
                }
                else if (key === 'fechaInicio' || key === 'fechaAprobacionRechazo' || key === 'fechaCompletado') {
                    request.input(col, mssql_1.default.Date, value ? new Date(value) : null);
                }
                else {
                    request.input(col, mssql_1.default.NVarChar, value || '');
                }
            }
        });
        // ✅ Si hay campos para actualizar, ejecutar la consulta
        if (fields.length > 0) {
            request.input('Id', mssql_1.default.Int, Number(id));
            const query = `
                UPDATE SolicitudesProyecto 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `;
            console.log('📝 Query SQL:', query);
            console.log('📝 Campos a actualizar:', fields);
            await request.query(query);
        }
        else {
            console.log('⚠️ No hay campos para actualizar');
        }
        // ✅ Devolver la solicitud actualizada con todos los datos
        const solicitud = await this.findById(id);
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }
        console.log('✅ Solicitud actualizada correctamente:', solicitud.id);
        return solicitud;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        const reqId = Number(id);
        // Eliminar proyectos asignados primero
        await db.request().input('Id', mssql_1.default.Int, reqId).query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @Id');
        // Eliminar la solicitud
        await db.request()
            .input('Id', mssql_1.default.Int, reqId)
            .query('DELETE FROM SolicitudesProyecto WHERE Id = @Id');
    }
    static async parseAndPopulateSolicitud(s) {
        const db = await (0, database_1.getDatabase)();
        // Obtener profesionales asignados
        const result = await db.request()
            .input('solicitudId', mssql_1.default.Int, s.Id)
            .query(`
                SELECT pa.ProfesionalId, p.Nombre AS profesionalNombre, pa.EstimacionHoras, pa.FechaAsignacion,
                       pa.FechaInicioEstimada, pa.FechaFinEstimada
                FROM ProyectosAsignados pa
                INNER JOIN Profesionales p ON pa.ProfesionalId = p.Id
                WHERE pa.SolicitudId = @solicitudId
                ORDER BY pa.FechaAsignacion DESC
            `);
        const asignaciones = result.recordset.map((a) => ({
            profesionalId: String(a.ProfesionalId),
            profesionalNombre: a.profesionalNombre,
            estimacionHoras: Number(a.EstimacionHoras || 0),
            fechaAsignacion: a.FechaAsignacion ? new Date(a.FechaAsignacion).toISOString().split('T')[0] : '',
            fechaInicioEstimada: a.FechaInicioEstimada ? new Date(a.FechaInicioEstimada).toISOString().split('T')[0] : undefined,
            fechaFinEstimada: a.FechaFinEstimada ? new Date(a.FechaFinEstimada).toISOString().split('T')[0] : undefined
        }));
        const estimacionHorasTotal = asignaciones.reduce((acc, a) => acc + a.estimacionHoras, 0);
        return {
            id: String(s.Id),
            token: s.Token,
            email: s.Email,
            fechaSolicitud: s.FechaSolicitud ? new Date(s.FechaSolicitud).toISOString().split('T')[0] : '',
            nombreSolicitante: s.NombreSolicitante,
            area: s.Area,
            gerenteSponsor: s.GerenteSponsor || '',
            nombreProyecto: s.NombreProyecto,
            objetivoGeneral: s.ObjetivoGeneral || '',
            objetivosEspecificos: s.ObjetivosEspecificos || '',
            coberturaAlcance: s.CoberturaAlcance || '',
            focoEstrategico: s.FocoEstrategico || '',
            impacto: s.Impacto || '',
            tieneSustentoLegal: s.TieneSustentoLegal === 1 || s.TieneSustentoLegal === true,
            sustentoLegalCual: s.SustentoLegalCual || '',
            tieneRequisitoFecha: s.TieneRequisitoFecha === 1 || s.TieneRequisitoFecha === true,
            requisitoFechaCual: s.RequisitoFechaCual || '',
            requisitoFechaPorque: s.RequisitoFechaPorque || '',
            observaciones: s.Observaciones || '',
            nombreResponsableProyecto: s.NombreResponsableProyecto || '',
            equipo: s.Equipo || '',
            nombreContraparteCliente: s.NombreContraparteCliente || '',
            areaContraparte: s.AreaContraparte || '',
            nombreJefaturaDirecta: s.NombreJefaturaDirecta || '',
            descripcionGeneral: s.DescripcionGeneral || '',
            presupuesto: Number(s.Presupuesto || 0),
            tiempo: s.Tiempo || '',
            otrasRestricciones: s.OtrasRestricciones || '',
            riesgos: s.Riesgos || '',
            valorDolar: Number(s.ValorDolar || 0),
            fechaInicio: s.FechaInicio ? new Date(s.FechaInicio).toISOString().split('T')[0] : '',
            estado: s.Estado,
            motivoRechazo: s.MotivoRechazo || '',
            fechaAprobacionRechazo: s.FechaAprobacionRechazo ? new Date(s.FechaAprobacionRechazo).toISOString().split('T')[0] : '',
            completadoPor: s.CompletadoPor || '',
            fechaCompletado: s.FechaCompletado ? new Date(s.FechaCompletado).toISOString().split('T')[0] : '',
            esEnvioParcial: s.EsEnvioParcial === 1 || s.EsEnvioParcial === true,
            observacionesAdmin: s.ObservacionesAdmin || '',
            profesionalesAsignados: asignaciones,
            estimacionHorasTotal: estimacionHorasTotal,
            created_at: s.FechaCreacion ? new Date(s.FechaCreacion).toISOString() : undefined,
            updated_at: s.FechaActualizacion ? new Date(s.FechaActualizacion).toISOString() : undefined
        };
    }
}
exports.SolicitudModel = SolicitudModel;
exports.default = SolicitudModel;
//# sourceMappingURL=Solicitud.js.map