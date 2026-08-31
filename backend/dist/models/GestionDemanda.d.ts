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
export declare class GestionDemandaModel {
    static create(data: Partial<DemandaData>): Promise<DemandaData>;
    static findById(id: string | number): Promise<DemandaData | undefined>;
    static findAll(): Promise<DemandaData[]>;
    static update(id: string | number, data: Partial<DemandaData>): Promise<DemandaData>;
    static updatePrioridad(id: string | number, prioridad: string): Promise<DemandaData>;
    static updateEstado(id: string | number, estado: string): Promise<DemandaData>;
    static delete(id: string | number): Promise<void>;
    static createFichaProyectoFromDemanda(demanda: DemandaData): Promise<void>;
    private static parseDemanda;
}
export default GestionDemandaModel;
//# sourceMappingURL=GestionDemanda.d.ts.map