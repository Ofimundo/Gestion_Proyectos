export interface FichaProspecto {
    id: string;
    codigo: string;
    nombreProyecto: string;
    estado: string;
    cliente: string;
    gestorComercial?: string;
    centroCosto?: string;
    fechaEstimadaAdjudicacion?: string;
    fechaAdjudicacion?: string;
    valorServicio?: number;
    margen?: number;
    rentabilidad?: number;
    plazoEstimado?: string;
    lineaServicio?: string;
    fechaInicio?: string;
    fechaTermino?: string;
    garantia?: string;
    horasSoporte?: number;
    totalIngresos?: number;
    estimaciones?: any;
    tipoCliente?: string;
    created_at?: string;
    updated_at?: string;
}
export declare class FichaProspectoModel {
    static create(data: Partial<FichaProspecto>): Promise<FichaProspecto>;
    static findById(id: string | number): Promise<FichaProspecto | undefined>;
    static findAll(): Promise<FichaProspecto[]>;
    static update(id: string | number, data: Partial<FichaProspecto>): Promise<FichaProspecto>;
    static delete(id: string | number): Promise<void>;
    private static parseFichaProspecto;
}
export default FichaProspectoModel;
//# sourceMappingURL=FichaProspecto.d.ts.map