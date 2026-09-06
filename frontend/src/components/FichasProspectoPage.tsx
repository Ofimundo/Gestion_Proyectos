import React from 'react';
import { useNavigate } from 'react-router-dom';
import FichasProspecto from './FichasProspecto';
import ofilabIcon from '../assets/ofilab-icon.png';

const FichasProspectoPage: React.FC = () => {
  const navigate = useNavigate();

  const handleConvertToProject = (prospecto: any) => {
    navigate('/fichas-proyecto', { state: { convertFromProspecto: prospecto } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center text-gray-600 hover:text-indigo-600 mr-2 sm:mr-4 text-xs sm:text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver</span>
              </button>
              <div className="flex items-center">
                <img 
                  src={ofilabIcon} 
                  alt="OFILAB" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain mr-2" 
                />
                <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Gestión de Prospectos
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FichasProspecto onConvertToProject={handleConvertToProject} />
      </main>
    </div>
  );
};

export default FichasProspectoPage;
