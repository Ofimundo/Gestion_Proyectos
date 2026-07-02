import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectStage } from '../../types/project.types';

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'En Curso': return 'bg-green-100 text-green-800';
      case 'Standby': return 'bg-yellow-100 text-yellow-800';
      case 'Completada': return 'bg-blue-100 text-blue-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'En Curso': return 'En Curso';
      case 'Standby': return 'En Espera';
      case 'Completada': return 'Completada';
      case 'Cancelado': return 'Cancelado';
      default: return 'No Iniciada';
    }
  };

  // Asegurarse de que stages existe
  const stages = project.stages || [];
  
  const activeStages: number = stages.filter((s: ProjectStage) => s.status === 'En Curso').length;
  
  const totalHH: number = stages.reduce((acc: number, s: ProjectStage) => {
    return acc + (s.hh_real || 0);
  }, 0);
  
  const progress: number = stages.length > 0 
    ? (stages.filter((s: ProjectStage) => s.status === 'Completada').length / stages.length) * 100
    : 0;

  // Asegurarse de que resources existe
  const resourcesCount: number = project.resources?.length || 0;

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(project.id);
    } else {
      navigate(`/proyectos/${project.id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {project.code || 'N/A'}
          </span>
          <h3 className="text-lg font-semibold text-gray-800 mt-2 line-clamp-1">
            {project.name}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status || 'No Iniciada')}`}>
          {getStatusText(project.status || 'No Iniciada')}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {project.description || 'Sin descripción'}
      </p>

      <div className="space-y-3">
        {/* Líder */}
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-700">{project.leader || 'Sin líder'}</span>
        </div>

        {/* Recursos */}
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-gray-700">{resourcesCount} recursos</span>
        </div>

        {/* HH */}
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-700">{totalHH} HH</span>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progreso</span>
            <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {activeStages} etapas activas de {stages.length}
          </span>
          <button 
            onClick={handleViewDetails}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Ver detalles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;