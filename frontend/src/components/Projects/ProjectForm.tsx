import React, { useState } from 'react';
import { useProjects } from '../../contexts/ProjectContext';

interface ProjectFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel }) => {
  const { addProject } = useProjects();
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    leader: '',
    description: '',
    technologies: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({
      ...formData,
      stages: [],
      risks: [],
      resources: []
    });
    onSubmit();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Proyecto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <input
            type="text"
            value={formData.client}
            onChange={(e) => setFormData({...formData, client: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Líder</label>
          <input
            type="text"
            value={formData.leader}
            onChange={(e) => setFormData({...formData, leader: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tecnologías</label>
          <input
            type="text"
            value={formData.technologies}
            onChange={(e) => setFormData({...formData, technologies: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: React, Node.js, Python"
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Proyecto
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;