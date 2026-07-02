import { getDatabase } from '../database/database';
import sql from 'mssql';

export interface SolicitudProyecto {
    id: string;
    token?: string;
    email?: string;
    fechaSolicitud: string;
    nombreSolicitante: string;
    area: string;
    gerenteSponsor: string;
    nombreProyecto: string;
    objetivoGeneral: string;
    objetivosEspecificos: string;
    coberturaAlcance: string;
    focoEstrategico: string;
    impacto: string;
    tieneSustentoLegal: boolean;
    sustentoLegalCual: string;
    tieneRequisitoFecha: boolean;
    requisitoFechaCual: string;
    requisitoFechaPorque: string;
    observaciones: string;
    nombreResponsableProyecto: string;
    equipo: string;
    nombreContraparteCliente: string;
    areaContraparte: string;
    nombreJefaturaDirecta: string;
    descripcionGeneral: string;
    presupuesto: number;
    tiempo: string;
    otrasRestricciones: string;
    riesgos: string;
    valorDolar: number;
    fechaInicio: string;
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En Revision';
    motivoRechazo?: string;
    fechaAprobacionRechazo?: string;
    completadoPor?: string;
    fechaCompletado?: string;
    esEnvioParcial?: boolean;
    observacionesAdmin?: string;
    profesionalesAsignados?: Array<{
        profesionalId: string;
        profesionalNombre: string;
        estimacionHoras: number;
        fechaAsignacion: string;
        fechaInicioEstimada?: string;
        fechaFinEstimada?: string;
    }>;
    estimacionHorasTotal?: number;
    created_at?: string;
    updated_at?: string;
}

export class SolicitudModel {
    static async create(data: Partial<SolicitudProyecto>): Promise<SolicitudProyecto> {
        const db = await getDatabase();
        
        // Generar token corto aleatorio
        const token = data.token || Math.random().toString(36).substring(2, 10).toUpperCase();

        const result = await db.request()
            .input('Token', sql.NVarChar, token)
            .input('Email', sql.NVarChar, data.email || null)
            .input('NombreSolicitante', sql.NVarChar, data.nombreSolicitante || '')
            .input('Area', sql.NVarChar, data.area || '')
            .input('GerenteSponsor', sql.NVarChar, data.gerenteSponsor || '')
            .input('NombreProyecto', sql.NVarChar, data.nombreProyecto || '')
            .input('ObjetivoGeneral', sql.NVarChar, data.objetivoGeneral || '')
            .input('ObjetivosEspecificos', sql.NVarChar, data.objetivosEspecificos || '')
            .input('CoberturaAlcance', sql.NVarChar, data.coberturaAlcance || '')
            .input('FocoEstrategico', sql.NVarChar, data.focoEstrategico || '')
            .input('Impacto', sql.NVarChar, data.impacto || '')
            .input('TieneSustentoLegal', sql.Bit, data.tieneSustentoLegal ? 1 : 0)
            .input('SustentoLegalCual', sql.NVarChar, data.sustentoLegalCual || '')
            .input('TieneRequisitoFecha', sql.Bit, data.tieneRequisitoFecha ? 1 : 0)
            .input('RequisitoFechaCual', sql.NVarChar, data.requisitoFechaCual || '')
            .input('RequisitoFechaPorque', sql.NVarChar, data.requisitoFechaPorque || '')
            .input('Observaciones', sql.NVarChar, data.observaciones || '')
            .input('NombreResponsableProyecto', sql.NVarChar, data.nombreResponsableProyecto || '')
            .input('Equipo', sql.NVarChar, data.equipo || '')
            .input('NombreContraparteCliente', sql.NVarChar, data.nombreContraparteCliente || '')
            .input('AreaContraparte', sql.NVarChar, data.areaContraparte || '')
            .input('NombreJefaturaDirecta', sql.NVarChar, data.nombreJefaturaDirecta || '')
            .input('DescripcionGeneral', sql.NVarChar, data.descripcionGeneral || '')
            .input('Presupuesto', sql.Decimal(18, 2), data.presupuesto || 0)
            .input('Tiempo', sql.NVarChar, data.tiempo || '')
            .input('OtrasRestricciones', sql.NVarChar, data.otrasRestricciones || '')
            .input('Riesgos', sql.NVarChar, data.riesgos || '')
            .input('ValorDolar', sql.Decimal(10, 2), data.valorDolar || 0)
            .input('FechaInicio', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
            .input('Estado', sql.NVarChar, data.estado || 'Pendiente')
            .input('EsEnvioParcial', sql.Bit, data.esEnvioParcial ? 1 : 0)
            .input('ObservacionesAdmin', sql.NVarChar, data.observacionesAdmin || null)
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

    static async findById(id: string | number): Promise<SolicitudProyecto | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query('SELECT * FROM SolicitudesProyecto WHERE Id = @Id');

        const solicitud = result.recordset[0];
        if (!solicitud) return undefined;

        return this.parseAndPopulateSolicitud(solicitud);
    }

    static async findByToken(token: string): Promise<SolicitudProyecto | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Token', sql.NVarChar, token)
            .query('SELECT * FROM SolicitudesProyecto WHERE Token = @Token');

        const solicitud = result.recordset[0];
        if (!solicitud) return undefined;

        return this.parseAndPopulateSolicitud(solicitud);
    }

    static async findAll(): Promise<SolicitudProyecto[]> {
        const db = await getDatabase();
        const result = await db.request().query('SELECT * FROM SolicitudesProyecto ORDER BY FechaCreacion DESC');
        
        const list: SolicitudProyecto[] = [];
        for (const s of result.recordset) {
            list.push(await this.parseAndPopulateSolicitud(s));
        }
        return list;
    }

    // ✅ MÉTODO UPDATE CORREGIDO - Guarda TODOS los campos
    static async update(id: string | number, data: Partial<SolicitudProyecto>): Promise<SolicitudProyecto> {
        const db = await getDatabase();
        
        console.log('🔧 Actualizando solicitud con datos:', JSON.stringify(data, null, 2));
        
        // Excluir relaciones
        const updates: any = { ...data };
        delete updates.profesionalesAsignados;
        delete updates.estimacionHorasTotal;
        delete updates.created_at;
        delete updates.updated_at;

        const fields: string[] = [];
        const request = db.request();

        // ✅ MAPEO COMPLETO DE TODOS LOS CAMPOS
        const columnMap: { [key: string]: string } = {
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
                    request.input(col, sql.Bit, value ? 1 : 0);
                } else if (key === 'presupuesto' || key === 'valorDolar') {
                    request.input(col, sql.Decimal(18, 2), value || 0);
                } else if (key === 'fechaInicio' || key === 'fechaAprobacionRechazo' || key === 'fechaCompletado') {
                    request.input(col, sql.Date, value ? new Date(value) : null);
                } else {
                    request.input(col, sql.NVarChar, value || '');
                }
            }
        });

        // ✅ Si hay campos para actualizar, ejecutar la consulta
        if (fields.length > 0) {
            request.input('Id', sql.Int, Number(id));
            const query = `
                UPDATE SolicitudesProyecto 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `;
            console.log('📝 Query SQL:', query);
            console.log('📝 Campos a actualizar:', fields);
            
            await request.query(query);
        } else {
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

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        const reqId = Number(id);
        
        // Eliminar proyectos asignados primero
        await db.request().input('Id', sql.Int, reqId).query('DELETE FROM ProyectosAsignados WHERE SolicitudId = @Id');
        
        // Eliminar la solicitud
        await db.request()
            .input('Id', sql.Int, reqId)
            .query('DELETE FROM SolicitudesProyecto WHERE Id = @Id');
    }

    private static async parseAndPopulateSolicitud(s: any): Promise<SolicitudProyecto> {
        const db = await getDatabase();
        
        // Obtener profesionales asignados
        const result = await db.request()
            .input('solicitudId', sql.Int, s.Id)
            .query(`
                SELECT pa.ProfesionalId, p.Nombre AS profesionalNombre, pa.EstimacionHoras, pa.FechaAsignacion,
                       pa.FechaInicioEstimada, pa.FechaFinEstimada
                FROM ProyectosAsignados pa
                INNER JOIN Profesionales p ON pa.ProfesionalId = p.Id
                WHERE pa.SolicitudId = @solicitudId
                ORDER BY pa.FechaAsignacion DESC
            `);

        const asignaciones = result.recordset.map((a: any) => ({
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

export default SolicitudModel;