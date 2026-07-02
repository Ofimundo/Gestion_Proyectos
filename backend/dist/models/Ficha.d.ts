export interface Ficha {
    id: string;
    codigo: string;
    nombreProyecto: string;
    cliente: string;
    lider: string;
    liderId?: string;
    descripcion: string;
    tecnologias: string;
    venta: number;
    hhImplementacion: number;
    hhPeriodo: number;
    recursos: string[];
    recursosIds?: string[];
    horasPorRecurso?: {
        [recursoId: string]: number;
    };
    fechaInicio: string;
    fechaTermino: string;
    contraparte: string;
    estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
    avance: number;
    hhPlanificadas: number;
    hhReal: number;
    alertas: string;
    acciones: string;
    responsable: string;
    responsableId?: string;
    bitacora: Array<{
        fecha: string;
        descripcion: string;
    }>;
    created_at?: string;
    updated_at?: string;
}
export declare class FichaModel {
    static create(data: Partial<Ficha>): Promise<Ficha>;
    static findById(id: string | number): Promise<Ficha | undefined>;
    static findAll(): Promise<Ficha[]>;
    static update(id: string | number, data: Partial<Ficha>): Promise<Ficha>;
    static delete(id: string | number): Promise<void>;
    private static parseFicha;
}
export default FichaModel;
//# sourceMappingURL=Ficha.d.ts.map