import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import ofilabIcon from '../../assets/ofilab-icon.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  currentView,
  userName,
  userEmail,
  onLogout 
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      route: '/dashboard',
      label: 'Dashboard Principal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'profesionales',
      route: '/profesionales',
      label: 'Colaboradores',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'fichas-prospecto',
      route: '/fichas-prospecto',
      label: 'Prospectos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'fichas-proyecto',
      route: '/fichas-proyecto',
      label: 'Fichas de Proyecto',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 'dashboard-proyectos',
      route: '/dashboard-proyectos',
      label: 'Dashboard HH',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'solicitud-proyecto',
      route: '/solicitud-proyecto',
      label: 'Solicitud de Proyecto',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'dashboard-profesional',
      route: '/dashboard-profesional',
      label: 'Dashboard Colaboradores',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'gestion-demanda',
      route: '/gestion-demanda',
      label: 'Gestión de la Demanda',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  const handleNavigation = (item: any) => {
    const route = typeof item === 'string' ? item : item.route;
    if (route) {
      navigate(route);
    }
    if (onNavigate) onNavigate(route);
    onClose();
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Overlay oscuro cuando el sidebar está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col h-full
        `}
      >
        {/* Logo y nombre de la app */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img src={ofilabIcon} alt="OFILAB" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold text-gray-800">Gestión Proyectos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Perfil del usuario */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail || 'usuario@email.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Menú de navegación - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentView === item.id || currentView === item.route;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                      transition-all duration-200 text-left
                      ${isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-indigo-600' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer del sidebar - Fijo abajo */}
        <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="p-4">
            {/* Botón de cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>

            {/* Versión */}
            <p className="mt-3 text-center text-xs text-gray-400">
              v1.0.0 - Gestión Proyectos
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;