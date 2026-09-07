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
export declare class GestionDemandaModel {
    static create(data: Partial<DemandaData>): Promise<DemandaData>;
    static findById(id: string | number): Promise<DemandaData | null>;
    static findAll(): Promise<DemandaData[]>;
    static update(id: string | number, data: Partial<DemandaData>): Promise<DemandaData>;
    static updatePrioridad(id: string | number, prioridad: string): Promise<DemandaData>;
    static updateEstado(id: string | number, estado: string): Promise<DemandaData>;
    static delete(id: string | number): Promise<void>;
    private static isDemandaAprobada;
    static createFichaProyectoFromDemanda(demanda: DemandaData): Promise<void>;
    private static parseDemanda;
}
export default GestionDemandaModel;
//# sourceMappingURL=GestionDemanda.d.ts.map