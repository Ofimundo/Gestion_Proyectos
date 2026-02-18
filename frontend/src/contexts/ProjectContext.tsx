import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, CreateProjectDTO, ProjectStage, ProjectRisk } from '../types/project.types';

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  addProject: (data: CreateProjectDTO) => void;
  updateProject: (id: string, data: Partial<CreateProjectDTO>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  searchProjects: (term: string) => Project[];
  getProjectStats: () => {
    totalProjects: number;
    totalHH: number;
    activeProjects: number;
    totalResources: number;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects debe usarse dentro de ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('projects');
      if (saved) {
        const parsedProjects = JSON.parse(saved);
        setProjects(parsedProjects);
      }
    } catch (err) {
      setError('Error al cargar los proyectos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToStorage = (data: Project[]) => {
    try {
      localStorage.setItem('projects', JSON.stringify(data));
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Error al guardar los proyectos');
      console.error(err);
    }
  };

  const generateCode = (name: string): string => {
    const letters = name
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, 'X');
    const numbers = Math.floor(1000 + Math.random() * 9000).toString();
    return `${letters}-${numbers}`;
  };

  const addProject = (data: CreateProjectDTO) => {
    const projectId = Date.now().toString();
    const now = new Date().toISOString();

    // Crear etapas con el formato correcto
    const stages: ProjectStage[] = data.stages?.map((stage, index) => ({
      id: `stage-${Date.now()}-${index}`,
      project_id: projectId,
      name: stage.name,
      status: stage.status,
      hh_planificadas: stage.hhPlanificadas || 0,
      hh_real: stage.hhReal || 0
    })) || [];

    // Crear riesgos con el formato correcto
    const risks: ProjectRisk[] = data.risks?.map((risk, index) => ({
      id: `risk-${Date.now()}-${index}`,
      project_id: projectId,
      description: risk.description,
      action: risk.action || null,
      responsible: risk.responsible || null,
      date: risk.date || null
    })) || [];

    const newProject: Project = {
      id: projectId,
      code: generateCode(data.name),
      name: data.name,
      client: data.client,
      leader: data.leader,
      description: data.description || null,
      technologies: data.technologies || null,
      commercial_manager: data.commercialManager || null,
      sale_amount: data.saleAmount || 0,
      hh_implementation: data.hhImplementation || 0,
      hh_period: data.hhPeriod || 0,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      client_contact: data.clientContact || null,
      status: 'Activo',
      created_at: now,
      updated_at: now,
      stages,
      risks,
      resources: data.resources || []
    };

    saveToStorage([...projects, newProject]);
  };

  const updateProject = (id: string, data: Partial<CreateProjectDTO>) => {
    const updated = projects.map(p => {
      if (p.id !== id) return p;

      // Actualizar solo los campos proporcionados
      const updatedProject: Project = {
        ...p,
        name: data.name ?? p.name,
        client: data.client ?? p.client,
        leader: data.leader ?? p.leader,
        description: data.description ?? p.description,
        technologies: data.technologies ?? p.technologies,
        commercial_manager: data.commercialManager ?? p.commercial_manager,
        sale_amount: data.saleAmount ?? p.sale_amount,
        hh_implementation: data.hhImplementation ?? p.hh_implementation,
        hh_period: data.hhPeriod ?? p.hh_period,
        start_date: data.startDate ?? p.start_date,
        end_date: data.endDate ?? p.end_date,
        client_contact: data.clientContact ?? p.client_contact,
        updated_at: new Date().toISOString()
      };

      // Actualizar etapas si se proporcionan
      if (data.stages) {
        updatedProject.stages = data.stages.map((stage, index) => ({
          id: p.stages?.[index]?.id || `stage-${Date.now()}-${index}`,
          project_id: id,
          name: stage.name,
          status: stage.status,
          hh_planificadas: stage.hhPlanificadas || 0,
          hh_real: stage.hhReal || 0
        }));
      }

      // Actualizar riesgos si se proporcionan
      if (data.risks) {
        updatedProject.risks = data.risks.map((risk, index) => ({
          id: p.risks?.[index]?.id || `risk-${Date.now()}-${index}`,
          project_id: id,
          description: risk.description,
          action: risk.action || null,
          responsible: risk.responsible || null,
          date: risk.date || null
        }));
      }

      // Actualizar recursos si se proporcionan
      if (data.resources) {
        updatedProject.resources = data.resources;
      }

      return updatedProject;
    });

    saveToStorage(updated);
  };

  const deleteProject = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      saveToStorage(projects.filter(p => p.id !== id));
    }
  };

  const getProject = (id: string) => {
    return projects.find(p => p.id === id);
  };

  const searchProjects = (term: string) => {
    const searchTerm = term.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.client.toLowerCase().includes(searchTerm) ||
      p.code.toLowerCase().includes(searchTerm)
    );
  };

  const getProjectStats = () => {
    return {
      totalProjects: projects.length,
      totalHH: projects.reduce((acc, p) => acc + (p.hh_implementation || 0), 0),
      activeProjects: projects.filter(p => p.status === 'Activo').length,
      totalResources: new Set(projects.flatMap(p => p.resources || [])).size,
    };
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      loading,
      error,
      addProject,
      updateProject,
      deleteProject,
      getProject,
      searchProjects,
      getProjectStats,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};