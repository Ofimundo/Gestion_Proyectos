import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Project } from '../../types/project.types';

interface ProjectFormProps {
  projectId?: string;
  initialData?: Project | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  projectId, 
  initialData,
  onSubmit, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    client: initialData?.client || '',
    leader: initialData?.leader || '',
    description: initialData?.description || '',
    technologies: initialData?.technologies || '',
    commercialManager: initialData?.commercial_manager || '',
    saleAmount: initialData?.sale_amount || 0,
    hhImplementation: initialData?.hh_implementation || 0,
    hhPeriod: initialData?.hh_period || 0,
    startDate: initialData?.start_date || '',
    endDate: initialData?.end_date || '',
    clientContact: initialData?.client_contact || '',
    status: initialData?.status || 'Activo'
  });

  // Cargar datos si se proporciona un ID
  useEffect(() => {
    if (projectId && !initialData) {
      const loadProject = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/projects/${projectId}`);
          if (response.data.success) {
            const data = response.data.data;
            setFormData({
              name: data.name || '',
              client: data.client || '',
              leader: data.leader || '',
              description: data.description || '',
              technologies: data.technologies || '',
              commercialManager: data.commercial_manager || '',
              saleAmount: data.sale_amount || 0,
              hhImplementation: data.hh_implementation || 0,
              hhPeriod: data.hh_period || 0,
              startDate: data.start_date || '',
              endDate: data.end_date || '',
              clientContact: data.client_contact || '',
              status: data.status || 'Activo'
            });
          }
        } catch (err: any) {
          console.error('Error cargando proyecto:', err);
          setError(err.response?.data?.message || 'Error al cargar el proyecto');
        } finally {
          setLoading(false);
        }
      };
      loadProject();
    }
  }, [projectId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        client: formData.client,
        leader: formData.leader,
        description: formData.description || null,
        technologies: formData.technologies || null,
        commercialManager: formData.commercialManager || null,
        saleAmount: parseFloat(formData.saleAmount.toString()) || 0,
        hhImplementation: parseInt(formData.hhImplementation.toString()) || 0,
        hhPeriod: parseInt(formData.hhPeriod.toString()) || 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        clientContact: formData.clientContact || null,
        status: formData.status || 'Activo'
      };

      let response;
      if (projectId || initialData) {
        const id = projectId || initialData?.id;
        response = await api.put(`/projects/${id}`, payload);
      } else {
        response = await api.post('/projects', payload);
      }

      if (response.data.success) {
        onSubmit();
      } else {
        setError(response.data.message || 'Error al guardar el proyecto');
      }
    } catch (err: any) {
      console.error('Error guardando proyecto:', err);
      setError(err.response?.data?.message || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {projectId || initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({...formData, client: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Líder *
            </label>
            <input
              type="text"
              value={formData.leader}
              onChange={(e) => setFormData({...formData, leader: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Activo">Activo</option>
              <option value="Standby">Standby</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HH Implementación
            </label>
            <input
              type="number"
              value={formData.hhImplementation}
              onChange={(e) => setFormData({...formData, hhImplementation: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HH Período
            </label>
            <input
              type="number"
              value={formData.hhPeriod}
              onChange={(e) => setFormData({...formData, hhPeriod: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tecnologías
            </label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({...formData, technologies: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: React, Node.js, Python, UiPath"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : (
              projectId || initialData ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;