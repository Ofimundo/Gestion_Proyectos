import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Professional } from '../../types/professional.types';

interface ProfessionalListProps {
  onSelectProfessional: (id: string) => void;
  onNewProfessional: () => void;
}

const ProfessionalList: React.FC<ProfessionalListProps> = ({ 
  onSelectProfessional, 
  onNewProfessional 
}) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar profesionales desde la API
  const loadProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/profesionales');
      if (response.data.success) {
        setProfessionals(response.data.data || []);
      } else {
        setError('Error al cargar profesionales');
      }
    } catch (err: any) {
      console.error('Error cargando profesionales:', err);
      setError(err.response?.data?.message || 'Error al cargar profesionales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  // Eliminar profesional
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este profesional?')) return;
    
    try {
      setDeletingId(id);
      const response = await api.delete(`/profesionales/${id}`);
      if (response.data.success) {
        await loadProfessionals(); // Recargar lista
      } else {
        setError(response.data.message || 'Error al eliminar profesional');
      }
    } catch (err: any) {
      console.error('Error eliminando profesional:', err);
      setError(err.response?.data?.message || 'Error al eliminar profesional');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar profesionales
  const filteredProfessionals = professionals.filter((p: Professional) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-gray-800">Colaboradores</h2>
        <button
          onClick={onNewProfessional}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Colaborador
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={loadProfessionals}
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
            placeholder="Buscar profesionales por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <p className="mt-1 text-sm text-gray-500">
            {filteredProfessionals.length} resultado(s) encontrado(s)
          </p>
        )}
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="mt-2 text-gray-500">
            {searchTerm ? 'No se encontraron profesionales' : 'No hay profesionales registrados'}
          </p>
          <button
            onClick={onNewProfessional}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Crear el primer profesional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((prof) => (
            <div 
              key={prof.id} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {prof.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{prof.name}</h3>
                      <p className="text-sm text-gray-600">{prof.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{prof.email}</p>
                  {prof.department && (
                    <p className="text-xs text-gray-400 mt-1">Depto: {prof.department}</p>
                  )}
                  {prof.specialties && prof.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {prof.specialties.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {spec}
                        </span>
                      ))}
                      {prof.specialties.length > 3 && (
                        <span className="text-xs text-gray-400">+{prof.specialties.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex space-x-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onSelectProfessional(prof.id)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(prof.id)}
                  disabled={deletingId === prof.id}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {deletingId === prof.id ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalList;