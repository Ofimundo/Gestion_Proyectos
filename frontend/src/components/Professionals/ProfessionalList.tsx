import React, { useState } from 'react';
import { useProfessionals } from '../../contexts/ProfessionalContext'; // Cambiado de '../../src/contexts/ProfessionalContext'
import type { Professional } from '../../types/professional.types';

interface ProfessionalListProps {
  onSelectProfessional: (id: string) => void;
  onNewProfessional: () => void;
}

const ProfessionalList: React.FC<ProfessionalListProps> = ({ onSelectProfessional, onNewProfessional }) => {
  const { professionals, deleteProfessional } = useProfessionals();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfessionals = professionals.filter((p: Professional) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profesionales</h2>
        <button
          onClick={onNewProfessional}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo Profesional
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar profesionales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfessionals.map((prof) => (
          <div key={prof.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg">{prof.name}</h3>
            <p className="text-gray-600">{prof.role}</p>
            <p className="text-sm text-gray-500">{prof.email}</p>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onSelectProfessional(prof.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                onClick={() => deleteProfessional(prof.id)}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfessionalList;