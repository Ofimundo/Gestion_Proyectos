export interface ProyectoAsignado {
    solicitudId: string;
    nombreProyecto: string;
    nombreSolicitante: string;
    area: string;
    estimacionHoras: number;
    fechaAsignacion: string;
    fechaInicioEstimada: string;
    fechaFinEstimada: string;
    estado: string;
    profesionalId: string;
    profesionalNombre: string;
}
export interface Professional {
    id: string;
    name: string;
    nombre?: string;
    email: string;
    role: string;
    cargo?: string;
    activo?: boolean;
    horasDisponibles?: number;
    horario?: any;
    department: string | null;
    phone: string | null;
    specialties: string[];
    hours_worked: number;
    proyectosAsignados?: ProyectoAsignado[];
    created_at: string;
    updated_at: string;
}
export interface CreateProfessionalDTO {
    name: string;
    email: string;
    role: string;
    horasDisponibles?: number;
    horario?: any;
    department?: string;
    phone?: string;
    specialties?: string[];
}
export declare class ProfessionalModel {
    static create(data: CreateProfessionalDTO): Promise<Professional>;
    static findById(id: string | number): Promise<Professional | undefined>;
    static findAll(): Promise<Professional[]>;
    static getProyectosAsignados(professionalId: string | number): Promise<ProyectoAsignado[]>;
    static update(id: string | number, data: Partial<CreateProfessionalDTO>): Promise<Professional>;
    static delete(id: string | number): Promise<void>;
    static search(term: string): Promise<Professional[]>;
    static getProjectProfessionals(projectId: string | number): Promise<Professional[]>;
    static getByEmail(email: string): Promise<Professional | undefined>;
    static getProfessionalsWithHours(): Promise<any[]>;
    static getAvailableProfessionals(): Promise<Professional[]>;
    static getStats(): Promise<any>;
    static getProfessionalsBySpecialty(specialty: string): Promise<Professional[]>;
    static assignToProject(professionalId: string | number, projectId: string | number): Promise<void>;
    static removeFromProject(professionalId: string | number, projectId: string | number): Promise<void>;
    private static parseProfessional;
}
export default ProfessionalModel;
//# sourceMappingURL=Professional.d.ts.map