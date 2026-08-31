import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Professional } from '../../types/professional.types';

interface ProfessionalFormProps {
  initialData?: Professional | null;
  professionalId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProfessionalForm: React.FC<ProfessionalFormProps> = ({ 
  initialData, 
  professionalId,
  onSubmit, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || '',
    department: initialData?.department || '',
    phone: initialData?.phone || '',
    specialties: initialData?.specialties || [],
  });

  // Cargar datos si se proporciona un ID
  useEffect(() => {
    if (professionalId && !initialData) {
      const loadProfessional = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/profesionales/${professionalId}`);
          if (response.data.success) {
            const data = response.data.data;
            setFormData({
              name: data.name || '',
              email: data.email || '',
              role: data.role || '',
              department: data.department || '',
              phone: data.phone || '',
              specialties: data.specialties || [],
            });
          }
        } catch (err: any) {
          console.error('Error cargando profesional:', err);
          setError(err.response?.data?.message || 'Error al cargar el profesional');
        } finally {
          setLoading(false);
        }
      };
      loadProfessional();
    }
  }, [professionalId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialData || professionalId) {
        // Actualizar profesional existente
        const id = initialData?.id || professionalId;
        const response = await api.put(`/profesionales/${id}`, formData);
        if (response.data.success) {
          onSubmit();
        } else {
          setError(response.data.message || 'Error al actualizar profesional');
        }
      } else {
        // Crear nuevo profesional
        const response = await api.post('/profesionales', formData);
        if (response.data.success) {
          onSubmit();
        } else {
          setError(response.data.message || 'Error al crear profesional');
        }
      }
    } catch (err: any) {
      console.error('Error guardando profesional:', err);
      setError(err.response?.data?.message || 'Error al guardar el profesional');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setFormData({ ...formData, specialties: values });
  };

  if (loading && !formData.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {initialData || professionalId ? 'Editar Colaborador' : 'Nuevo Colaborador'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <input
            type="text"
            placeholder="Ej: Desarrollador RPA, Analista, QA, etc."
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <input
            type="text"
            placeholder="Ej: Tecnología, Operaciones, Finanzas"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            placeholder="Ej: +56 9 1234 5678"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especialidades (separadas por coma)
          </label>
          <input
            type="text"
            placeholder="Ej: Python, UiPath, SQL, Power BI"
            value={formData.specialties.join(', ')}
            onChange={handleSpecialtiesChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {formData.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {formData.specialties.map((spec, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {spec}
                </span>
              ))}
            </div>
          )}
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
              initialData || professionalId ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalForm;