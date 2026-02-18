import React from 'react';
import { useProjects } from '../../contexts/ProjectContext';

interface ProjectDetailProps {
  projectId: string;
  onEdit: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onEdit }) => {
  const { getProject } = useProjects();
  const project = getProject(projectId);

  if (!project) {
    return <div className="p-6 text-center text-gray-500">Proyecto no encontrado</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Código: {project.code}</p>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{project.client}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Líder</p>
          <p className="font-medium">{project.leader}</p>
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
    </div>
  );
};

export default ProjectDetail;