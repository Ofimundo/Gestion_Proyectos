import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Project } from '../../types/project.types';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onNewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar proyectos desde la API
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/projects');
      if (response.data.success) {
        setProjects(response.data.data || []);
      } else {
        setError('Error al cargar proyectos');
      }
    } catch (err: any) {
      console.error('Error cargando proyectos:', err);
      setError(err.response?.data?.message || 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Eliminar proyecto
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) return;
    
    try {
      setDeletingId(id);
      const response = await api.delete(`/projects/${id}`);
      if (response.data.success) {
        await loadProjects();
      } else {
        setError(response.data.message || 'Error al eliminar proyecto');
      }
    } catch (err: any) {
      console.error('Error eliminando proyecto:', err);
      setError(err.response?.data?.message || 'Error al eliminar proyecto');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar proyectos
  const filteredProjects = projects.filter((project: Project) => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Proyectos</h2>
        <button
          onClick={onNewProject}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={loadProjects}
            className="mt-1 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar proyectos por nombre, cliente o código..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <p className="mt-1 text-sm text-gray-500">
            {filteredProjects.length} resultado(s) encontrado(s)
          </p>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="mt-2 text-gray-500 text-lg">
            {searchTerm ? 'No se encontraron proyectos' : 'No hay proyectos registrados'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea un nuevo proyecto para comenzar'}
          </p>
          {!searchTerm && (
            <button
              onClick={onNewProject}
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Crear el primer proyecto
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Líder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project: Project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {project.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.leader}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status || 'No Iniciada')}`}>
                      {getStatusText(project.status || 'No Iniciada')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        title="Ver detalles"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                        title="Eliminar proyecto"
                      >
                        {deletingId === project.id ? (
                          <svg className="animate-spin h-4 w-4 inline" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          'Eliminar'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectList;