import React from 'react';

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
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'projects',
      label: 'Proyectos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 'professionals',
      label: 'Profesionales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const handleNavigation = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Overlay oscuro cuando el sidebar está abierto en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 w-64 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo y nombre de la app */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            <span className="text-lg font-bold text-gray-800">RPA Manager</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Perfil del usuario */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
              {userName?.charAt(0) || 'U'}
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

        {/* Menú de navegación */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${currentView === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className={currentView === item.id ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                  
                  {/* Badge de ejemplo para reportes */}
                  {item.id === 'reports' && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      3
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección de proyectos recientes */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Proyectos Recientes
            </p>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors truncate">
                📊 RPA Bancaría (MEDI-0001)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors truncate">
                🤖 Automatización Contable (AUTC-2345)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors truncate">
                📈 Reportes Financieros (RFIN-7890)
              </button>
            </div>
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={onLogout}
            className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;