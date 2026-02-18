import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Proyecto {
  id: string;
  codigo: string;
  nombreProyecto: string;
  cliente: string;
  lider: string;
  estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
  avance: number;
  venta: number;
  hhPlanificadas: number;
  hhReal: number;
}

interface Profesional {
  id: string;
  nombre: string;
  activo: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const proyectosGuardados = localStorage.getItem('rpa_proyectos');
        if (proyectosGuardados) {
          setProyectos(JSON.parse(proyectosGuardados));
        }

        const profesionalesGuardados = localStorage.getItem('rpa_profesionales');
        if (profesionalesGuardados) {
          setProfesionales(JSON.parse(profesionalesGuardados));
        }

        const fichasGuardadas = localStorage.getItem('rpa_fichas');
        if (fichasGuardadas) {
          setFichas(JSON.parse(fichasGuardadas));
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const proyectosActivos = proyectos.filter(p => p.estado === 'En Curso').length;
  const profesionalesActivos = profesionales.filter(p => p.activo).length;
  const totalVentas = proyectos.reduce((sum, p) => sum + (p.venta || 0), 0);
  const totalHorasHombre = proyectos.reduce((sum, p) => sum + (p.hhReal || 0), 0);

  const modules = [
    {
      id: 1,
      title: 'Profesionales',
      description: 'Gestión de profesionales del equipo',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      route: '/profesionales',
      stats: `${profesionalesActivos} profesionales activos`
    },
    {
      id: 2,
      title: 'Fichas',
      description: 'Gestión de fichas de proyectos RPA',
      icon: '📋',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      route: '/fichas',
      stats: `${fichas.length} fichas activas`
    },
    {
      id: 3,
      title: 'Dashboard',
      description: 'Horas hombre, proyectos y métricas',
      icon: '📊',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      route: '/dashboard-proyectos',
      stats: `${proyectosActivos} proyectos activos`
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start mb-2 sm:mb-0">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-semibold text-gray-800">Sistema Gestión</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-600 ml-2 truncate max-w-[120px] sm:max-w-none">
                {user?.name || 'Usuario'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              {/* Botón de Perfil */}
              <button
                onClick={() => navigate('/perfil')}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center px-2 sm:px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden xs:inline">Mi Perfil</span>
                <span className="xs:hidden">Perfil</span>
              </button>

              {/* Botón de Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium flex items-center px-2 sm:px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xs:inline">Cerrar sesión</span>
                <span className="xs:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Panel de Control
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-600 px-2">
            Selecciona un módulo para gestionar
          </p>
        </div>

        {/* Grid de módulos principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => navigate(module.route)}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
            >
              <div className={`h-1.5 sm:h-2 bg-gradient-to-r ${module.color}`}></div>
              
              <div className="p-4 sm:p-6 md:p-8">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 ${module.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl sm:text-3xl md:text-4xl">{module.icon}</span>
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {module.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {module.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-semibold ${module.textColor}`}>
                    {module.stats}
                  </span>
                  <button className={`${module.textColor} hover:opacity-80 font-medium text-xs sm:text-sm flex items-center`}>
                    <span className="hidden xs:inline">Acceder</span>
                    <span className="xs:hidden">Ir</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen rápido */}
        <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Horas Hombre</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{totalHorasHombre.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Proyectos Activos</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{proyectosActivos}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Profesionales</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{profesionalesActivos}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Venta Total</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">${totalVentas.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;