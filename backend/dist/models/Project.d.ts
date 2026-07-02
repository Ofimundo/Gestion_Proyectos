export interface Project {
    id: string;
    code: string;
    name: string;
    client: string;
    leader: string;
    description: string | null;
    technologies: string | null;
    commercial_manager: string | null;
    sale_amount: number;
    hh_implementation: number;
    hh_period: number;
    start_date: string | null;
    end_date: string | null;
    client_contact: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}
export interface CreateProjectDTO {
    name: string;
    client: string;
    leader: string;
    description?: string;
    technologies?: string;
    saleAmount?: number;
    hhPlanificadas?: number;
    hhReal?: number;
    startDate?: string;
    endDate?: string;
}
export declare class ProjectModel {
    static generateCode(name: string): string;
    static create(data: CreateProjectDTO): Promise<Project>;
    static findById(id: string | number): Promise<Project | undefined>;
    static getByCode(code: string): Promise<Project | undefined>;
    static getProjectSummary(id: string | number): Promise<any | undefined>;
    static getProjectResources(id: string | number): Promise<any[]>;
    static updateStatus(id: string | number, status: string): Promise<boolean>;
    static findAll(): Promise<Project[]>;
    static update(id: string | number, data: Partial<CreateProjectDTO>): Promise<Project>;
    static delete(id: string | number): Promise<void>;
    static search(term: string): Promise<Project[]>;
    static getStats(): Promise<any>;
    private static parseProject;
}
export default ProjectModel;
//# sourceMappingURL=Project.d.ts.map