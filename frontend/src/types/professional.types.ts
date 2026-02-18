export interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  specialties: string[];
  projects: string[]; // IDs de proyectos
  hoursWorked: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalFormData {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  specialties: string[];
}