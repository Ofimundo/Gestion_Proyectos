import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Professional, ProfessionalFormData } from '../types/professional.types';

interface ProfessionalContextType {
  professionals: Professional[];
  loading: boolean;
  error: string | null;
  addProfessional: (data: ProfessionalFormData) => void;
  updateProfessional: (id: string, data: ProfessionalFormData) => void;
  deleteProfessional: (id: string) => void;
  getProfessional: (id: string) => Professional | undefined;
  searchProfessionals: (term: string) => Professional[];
}

const ProfessionalContext = createContext<ProfessionalContextType | undefined>(undefined);

export const useProfessionals = () => {
  const context = useContext(ProfessionalContext);
  if (!context) {
    throw new Error('useProfessionals debe usarse dentro de ProfessionalProvider');
  }
  return context;
};

export const ProfessionalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('professionals');
      if (saved) {
        setProfessionals(JSON.parse(saved));
      }
    } catch (err) {
      setError('Error al cargar los profesionales');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToStorage = (data: Professional[]) => {
    try {
      localStorage.setItem('professionals', JSON.stringify(data));
      setProfessionals(data);
    } catch (err) {
      setError('Error al guardar los profesionales');
    }
  };

  const addProfessional = (data: ProfessionalFormData) => {
    const newProfessional: Professional = {
      id: Date.now().toString(),
      ...data,
      specialties: data.specialties || [],
      projects: [],
      hoursWorked: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage([...professionals, newProfessional]);
  };

  const updateProfessional = (id: string, data: ProfessionalFormData) => {
    const updated = professionals.map(p => 
      p.id === id 
        ? { ...p, ...data, updatedAt: new Date().toISOString() }
        : p
    );
    saveToStorage(updated);
  };

  const deleteProfessional = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este profesional?')) {
      saveToStorage(professionals.filter(p => p.id !== id));
    }
  };

  const getProfessional = (id: string) => {
    return professionals.find(p => p.id === id);
  };

  const searchProfessionals = (term: string) => {
    const searchTerm = term.toLowerCase();
    return professionals.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.email.toLowerCase().includes(searchTerm) ||
      p.role.toLowerCase().includes(searchTerm)
    );
  };

  return (
    <ProfessionalContext.Provider value={{
      professionals,
      loading,
      error,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      getProfessional,
      searchProfessionals,
    }}>
      {children}
    </ProfessionalContext.Provider>
  );
};