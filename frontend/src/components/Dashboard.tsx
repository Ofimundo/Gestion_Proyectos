import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

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



interface Ficha {
  id: string;
  nombreProyecto: string;
  estado: string;
}

interface DashboardStats {
  totalProfesionales: number;
  profesionalesActivos: number;
  totalProyectos: number;
  proyectosActivos: number;
  totalHHReales: number;
  totalHHPlan: number;
  totalVentas: number;
  desviacionHoras: number;
  porcentajeCumplimiento: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [fichasProspecto, setFichasProspecto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProfesionales: 0,
    profesionalesActivos: 0,
    totalProyectos: 0,
    proyectosActivos: 0,
    totalHHReales: 0,
    totalHHPlan: 0,
    totalVentas: 0,
    desviacionHoras: 0,
    porcentajeCumplimiento: 0
  });

  // Cargar datos desde la API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar fichas, prospectos y profesionales en paralelo
      const [fichasResponse, prospectosResponse, profesionalesResponse] = await Promise.all([
        api.get('/fichas'),
        api.get('/fichas-prospecto'),
        api.get('/profesionales')
      ]);

      const fichasData = fichasResponse.data?.success ? fichasResponse.data.data || [] : [];
      const prospectosData = prospectosResponse.data?.success ? prospectosResponse.data.data || [] : [];
      const profesionalesData = profesionalesResponse.data?.success ? profesionalesResponse.data.data || [] : [];

      setFichas(fichasData);
      setProyectos(fichasData);
      setFichasProspecto(prospectosData);

      // Calcular estadísticas basadas en las fichas
      const proyectosActivos = fichasData.filter((f: any) => f.estado === 'En Curso').length;
      const profesionalesActivos = profesionalesData.filter((p: any) => p.activo).length;
      const totalVentas = fichasData.reduce((sum: number, f: any) => sum + (f.venta || 0), 0);
      const totalHHReales = fichasData.reduce((sum: number, f: any) => sum + (f.hhReal || 0), 0);
      const totalHHPlan = fichasData.reduce((sum: number, f: any) => sum + (f.hhPlanificadas || 0), 0);
      const desviacion = totalHHReales - totalHHPlan;
      const cumplimiento = totalHHPlan > 0 ? (totalHHReales / totalHHPlan) * 100 : 0;

      setStats({
        totalProfesionales: profesionalesData.length,
        profesionalesActivos,
        totalProyectos: fichasData.length,
        proyectosActivos,
        totalHHReales,
        totalHHPlan,
        totalVentas,
        desviacionHoras: desviacion,
        porcentajeCumplimiento: cumplimiento
      });

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Obtener proyectos con más HH
  const proyectosTopHH = [...proyectos]
    .sort((a, b) => (b.hhReal || 0) - (a.hhReal || 0))
    .slice(0, 5);

  const modules = [
    {
      id: 1,
      title: 'Colaboradores',
      description: 'Gestión de colaboradores del equipo',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      route: '/profesionales',
      stats: `${stats.profesionalesActivos} colaboradores activos`
    },
    {
      id: 2,
      title: 'Prospectos',
      description: 'Gestión y seguimiento de prospectos comerciales',
      icon: '📑',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      route: '/fichas-prospecto',
      stats: `${fichasProspecto.length} prospectos`
    },
    {
      id: 3,
      title: 'Ficha Proyecto',
      description: 'Gestión de fichas de proyectos en curso',
      icon: '📋',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      route: '/fichas-proyecto',
      stats: `${fichas.length} fichas activas`
    },
    {
      id: 4,
      title: 'Dashboard HH',
      description: 'Horas hombre, proyectos y métricas',
      icon: '📊',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      route: '/dashboard-proyectos',
      stats: `${stats.proyectosActivos} proyectos activos`
    },
    {
      id: 5,
      title: 'Solicitud de Proyecto',
      description: 'Crear nueva solicitud de proyecto',
      icon: '📝',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      route: '/solicitud-proyecto',
      stats: 'Nueva solicitud'
    },
    {
      id: 6,
      title: 'Dashboard Colaboradores',
      description: 'Proyectos y horas por colaborador',
      icon: '👨‍💻',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      route: '/dashboard-profesional',
      stats: `${stats.profesionalesActivos} colaboradores`
    },
    {
      id: 7,
      title: 'Gestión de la Demanda',
      description: 'Recepción y seguimiento de proyectos internos y externos',
      icon: '📥',
      color: 'from-sky-500 to-indigo-600',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      route: '/gestion-demanda',
      stats: 'Proyectos internos y externos'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10">
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
                {user?.nombre || 'Usuario'}
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

              {/* Botón de Actualizar */}
              <button
                onClick={loadData}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center px-2 sm:px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => navigate(module.route)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden group flex flex-col justify-between border border-gray-100"
            >
              <div className={`h-2 bg-gradient-to-r ${module.color}`}></div>
              
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 ${module.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                      <span className="text-2xl sm:text-3xl">{module.icon}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${module.bgColor} ${module.textColor}`}>
                      Módulo
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {module.title}
                  </h2>

                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    {module.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-semibold ${module.textColor}`}>
                    {module.stats}
                  </span>
                  <div className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold ${module.textColor} group-hover:translate-x-1 transition-transform`}>
                    <span>Acceder</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tarjetas de resumen HH */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Métricas de Horas Hombre (HH)
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 text-white">
              <p className="text-xs opacity-90">HH Reales Ejecutadas</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalHHReales.toLocaleString()} hrs</p>
              <p className="text-xs opacity-75 mt-1">Total de horas ejecutadas en proyectos</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 text-white">
              <p className="text-xs opacity-90">HH Planificadas</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalHHPlan.toLocaleString()} hrs</p>
              <p className="text-xs opacity-75 mt-1">Total de horas presupuestadas</p>
            </div>

            <div className={`rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 text-white ${stats.desviacionHoras >= 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
              <p className="text-xs opacity-90">Desviación HH</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                {stats.desviacionHoras >= 0 ? '+' : ''}{stats.desviacionHoras.toLocaleString()} hrs
              </p>
              <p className="text-xs opacity-75 mt-1">
                {stats.desviacionHoras >= 0 ? 'Sobre ejecución' : 'Sub ejecución'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 text-white">
              <p className="text-xs opacity-90">Cumplimiento</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.porcentajeCumplimiento.toFixed(1)}%</p>
              <p className="text-xs opacity-75 mt-1">Real vs Planificado</p>
            </div>
          </div>
        </div>

        {/* Tabla de proyectos con más HH */}
        {proyectosTopHH.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Proyectos con mayor HH Real
            </h2>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">HH Plan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">HH Real</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Desviación</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proyectosTopHH.map((proyecto) => {
                      const desviacion = (proyecto.hhReal || 0) - (proyecto.hhPlanificadas || 0);
                      const desviacionColor = desviacion > 0 ? 'text-red-600' : desviacion < 0 ? 'text-green-600' : 'text-gray-600';
                      return (
                        <tr key={proyecto.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {proyecto.nombreProyecto}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {proyecto.cliente}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                            {proyecto.hhPlanificadas || 0} hrs
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                            {proyecto.hhReal || 0} hrs
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-medium ${desviacionColor}`}>
                            {desviacion > 0 ? '+' : ''}{desviacion} hrs
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              proyecto.estado === 'En Curso' ? 'bg-green-100 text-green-800' :
                              proyecto.estado === 'Completada' ? 'bg-blue-100 text-blue-800' :
                              proyecto.estado === 'Standby' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {proyecto.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resumen rápido adicional */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Proyectos Activos</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{stats.proyectosActivos}</p>
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
                <p className="text-xs text-gray-600">Colaboradores</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{stats.profesionalesActivos}</p>
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
                <p className="text-xs text-gray-600">Total Proyectos</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{stats.totalProyectos}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Venta Total</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">${stats.totalVentas.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Nota explicativa si hay HH muy altas */}
        {stats.totalHHReales > 1000 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Información de HH Reales</p>
                <p className="text-xs text-yellow-700 mt-1">
                  El total de HH Reales ({stats.totalHHReales.toLocaleString()} hrs) incluye la suma de todas las horas registradas en los proyectos.
                  Si este número parece alto, revisa los proyectos con mayores valores en la tabla superior.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;