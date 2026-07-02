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
export declare class SolicitudModel {
    static create(data: Partial<SolicitudProyecto>): Promise<SolicitudProyecto>;
    static findById(id: string | number): Promise<SolicitudProyecto | undefined>;
    static findByToken(token: string): Promise<SolicitudProyecto | undefined>;
    static findAll(): Promise<SolicitudProyecto[]>;
    static update(id: string | number, data: Partial<SolicitudProyecto>): Promise<SolicitudProyecto>;
    static delete(id: string | number): Promise<void>;
    private static parseAndPopulateSolicitud;
}
export default SolicitudModel;
//# sourceMappingURL=Solicitud.d.ts.map