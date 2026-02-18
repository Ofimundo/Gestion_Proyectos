import React, { useState } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import type { Project } from '../../types/project.types';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onNewProject }) => {
  const { projects, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredProjects = projects.filter((project: Project) => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'En Curso': return 'bg-green-100 text-green-800';
      case 'Standby': return 'bg-yellow-100 text-yellow-800';
      case 'Completada': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      await deleteProject(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Proyectos</h2>
        <button
          onClick={onNewProject}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Proyecto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay proyectos para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">Crea un nuevo proyecto para comenzar</p>
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
                      {project.status || 'No Iniciada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        title="Ver detalles"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                        title="Eliminar proyecto"
                      >
                        Eliminar
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