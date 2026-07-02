import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Project } from '../../types/project.types';

interface ProjectDetailProps {
  projectId: string;
  onEdit: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onEdit }) => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyecto desde la API
  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/projects/${projectId}`);
      if (response.data.success) {
        setProject(response.data.data);
      } else {
        setError('Proyecto no encontrado');
      }
    } catch (err: any) {
      console.error('Error cargando proyecto:', err);
      setError(err.response?.data?.message || 'Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="text-red-600 mb-4">{error || 'Proyecto no encontrado'}</div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Volver a Proyectos
        </button>
      </div>
    );
  }

  // Calcular estadísticas
  const totalHH = project.stages?.reduce((acc, s) => acc + (s.hh_real || 0), 0) || 0;
  const progress = (project.stages && project.stages.length > 0)
    ? (project.stages.filter(s => s.status === 'Completada').length / project.stages.length) * 100
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status || 'No Iniciada')}`}>
              {getStatusText(project.status || 'No Iniciada')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Código: {project.code}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{project.client}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Líder</p>
          <p className="font-medium">{project.leader}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Fecha Inicio</p>
          <p className="font-medium">{project.start_date || 'No definida'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Fecha Fin</p>
          <p className="font-medium">{project.end_date || 'No definida'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Descripción</p>
          <p className="mt-1">{project.description || 'Sin descripción'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Tecnologías</p>
          <p className="mt-1">{project.technologies || 'No especificadas'}</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">HH Totales</p>
          <p className="text-2xl font-bold text-blue-700">{totalHH}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Progreso</p>
          <p className="text-2xl font-bold text-green-700">{Math.round(progress)}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">Etapas</p>
          <p className="text-2xl font-bold text-purple-700">{project.stages?.length || 0}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600">Recursos</p>
          <p className="text-2xl font-bold text-orange-700">{project.resources?.length || 0}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso del Proyecto</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Etapas del Proyecto */}
      {project.stages && project.stages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Etapas del Proyecto</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">HH Planificadas</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">HH Reales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {project.stages.map((stage, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{stage.name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stage.status)}`}>
                        {getStatusText(stage.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600">{stage.hh_planificadas || 0}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600">{stage.hh_real || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Riesgos */}
      {project.risks && project.risks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Riesgos Identificados</h3>
          <div className="space-y-2">
            {project.risks.map((risk, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">{risk.description}</p>
                {risk.action && (
                  <p className="text-xs text-yellow-700 mt-1">Acción: {risk.action}</p>
                )}
                {risk.responsible && (
                  <p className="text-xs text-yellow-700">Responsable: {risk.responsible}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;