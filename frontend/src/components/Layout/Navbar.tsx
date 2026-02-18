import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
  onLogout: () => void;
  userName: string;
  userEmail: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, 
  currentView, 
  onLogout, 
  userName, 
  userEmail 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'projects': return 'Gestión de Proyectos';
      case 'professionals': return 'Directorio de Profesionales';
      case 'reports': return 'Reportes y Estadísticas';
      case 'projectForm': return 'Nuevo Proyecto';
      case 'professionalForm': return 'Formulario de Profesional';
      case 'projectDetail': return 'Detalle del Proyecto';
      default: return 'RPA Manager';
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center ml-2 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RP</span>
                </div>
                <span className="ml-2 text-lg font-bold text-gray-800">RPA Manager</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {getViewTitle()}
              </h1>
            </div>

            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                    {userName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm text-gray-700 hidden md:block">
                    {userName || 'Usuario'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Configuración
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        currentView={currentView}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      <div className="h-16" />
    </>
  );
};

export default Navbar;