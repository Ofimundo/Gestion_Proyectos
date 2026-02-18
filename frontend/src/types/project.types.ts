export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  status: string;
  hh_planificadas: number;
  hh_real: number;
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  description: string;
  action: string | null;
  responsible: string | null;
  date: string | null;
}

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
  stages?: ProjectStage[];
  risks?: ProjectRisk[];
  resources?: string[];
}

export interface CreateProjectDTO {
  name: string;
  client: string;
  leader: string;
  description?: string;
  technologies?: string;
  commercialManager?: string;
  saleAmount?: number;
  hhImplementation?: number;
  hhPeriod?: number;
  startDate?: string;
  endDate?: string;
  clientContact?: string;
  stages?: Array<{
    name: string;
    status: string;
    hhPlanificadas: number;
    hhReal: number;
  }>;
  risks?: Array<{
    description: string;
    action?: string;
    responsible?: string;
    date?: string;
  }>;
  resources?: string[];
}