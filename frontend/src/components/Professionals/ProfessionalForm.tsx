import React, { useState } from 'react';
import { useProfessionals } from '../../contexts/ProfessionalContext'; // Cambiado de '../../src/contexts/ProfessionalContext'
import type { Professional } from '../../types/professional.types';

interface ProfessionalFormProps {
  initialData?: Professional | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProfessionalForm: React.FC<ProfessionalFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { addProfessional, updateProfessional } = useProfessionals();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || '',
    department: initialData?.department || '',
    phone: initialData?.phone || '',
    specialties: initialData?.specialties || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      updateProfessional(initialData.id, formData);
    } else {
      addProfessional(formData);
    }
    onSubmit();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {initialData ? 'Editar Profesional' : 'Nuevo Profesional'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Rol"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {initialData ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalForm;