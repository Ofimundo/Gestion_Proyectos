import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ofilabIcon from '../assets/ofilab-icon.png';
import Sidebar from './Layout/Sidebar';

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
  const [fichasProspecto, setFichasProspecto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Proyectos top HH
  const proyectosTopHH = [...proyectos]
    .sort((a, b) => (b.hhReal || 0) - (a.hhReal || 0))
    .slice(0, 5);

  // Desglose de estados de proyectos
  const proyectosEnCurso = proyectos.filter(p => p.estado === 'En Curso').length;
  const proyectosCompletados = proyectos.filter(p => p.estado === 'Completada').length;
  const proyectosStandby = proyectos.filter(p => p.estado === 'Standby').length;
  const proyectosNoIniciados = proyectos.filter(p => p.estado === 'No Iniciada' || !p.estado).length;
  const totalP = proyectos.length || 1;

  const pctEnCurso = Math.round((proyectosEnCurso / totalP) * 100);
  const pctCompletados = Math.round((proyectosCompletados / totalP) * 100);
  const pctStandby = Math.round((proyectosStandby / totalP) * 100);
  const pctNoIniciados = Math.round((proyectosNoIniciados / totalP) * 100);

  const modulesQuickLinks = [
    { name: 'Colaboradores', route: '/profesionales', icon: '👥', color: 'bg-blue-500' },
    { name: `Prospectos (${fichasProspecto.length})`, route: '/fichas-prospecto', icon: '📑', color: 'bg-indigo-500' },
    { name: 'Fichas de Proyecto', route: '/fichas-proyecto', icon: '📋', color: 'bg-purple-500' },
    { name: 'Dashboard HH', route: '/dashboard-proyectos', icon: '📊', color: 'bg-green-500' },
    { name: 'Solicitud Proyecto', route: '/solicitud-proyecto', icon: '📝', color: 'bg-orange-500' },
    { name: 'Colaboradores HH', route: '/dashboard-profesional', icon: '👨‍💻', color: 'bg-teal-500' },
    { name: 'Gestión Demanda', route: '/gestion-demanda', icon: '📥', color: 'bg-sky-600' },
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
          <p className="text-sm sm:text-base text-gray-600 font-medium">Cargando indicadores de OFILAB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md shadow-lg text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600 font-bold">!</div>
          <p className="text-red-700 font-semibold mb-4">{error}</p>
          <button
            onClick={loadData}
            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-all shadow-md"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Menu Lateral Desplegable (Sidebar Hamburguesa) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(route) => navigate(route)}
        currentView="dashboard"
        userName={user?.nombre || ''}
        userEmail={user?.email || ''}
        onLogout={handleLogout}
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar Superior Sticky */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Botón Hamburguesa e Isotipo OFILAB */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none flex items-center justify-center"
                  title="Abrir/Cerrar menú desplegable"
                  aria-label="Abrir menú"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="flex items-center space-x-2">
                  <img 
                    src={ofilabIcon} 
                    alt="OFILAB" 
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain" 
                  />
                  <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    OFILAB <span className="text-indigo-600 font-medium text-xs sm:text-sm">Control Center</span>
                  </span>
                </div>
              </div>

              {/* Botones de Usuario y Acciones Header */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={loadData}
                  className="text-xs sm:text-sm text-gray-600 hover:text-indigo-600 font-medium flex items-center px-2.5 py-1.5 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Actualizar datos"
                >
                  <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Actualizar</span>
                </button>

                <button
                  onClick={() => navigate('/perfil')}
                  className="text-xs sm:text-sm text-indigo-700 font-medium flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs mr-1.5 font-bold">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xs:inline">{user?.nombre || 'Mi Perfil'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Área del Dashboard con Indicadores */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* Header Saludo Limpio */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium mb-3 backdrop-blur-sm">
              ⚡ Panel de Control Ejecutivo
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¡Bienvenido, {user?.nombre || 'Usuario'}! 👋
            </h1>
          </div>

          {/* Tarjetas de Indicadores Principales (KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* KPI 1: Ventas Totales */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Venta Total Presupuestada</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
                    ${stats.totalVentas.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  💼
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-bold flex items-center">
                  ↑ {stats.totalProyectos} Proyectos registrados
                </span>
                <span className="text-gray-400">Total Fichas</span>
              </div>
            </div>

            {/* KPI 2: Proyectos Activos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proyectos En Curso</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
                    {stats.proyectosActivos} <span className="text-sm font-normal text-gray-400">/ {stats.totalProyectos}</span>
                  </h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  🚀
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pctEnCurso}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{pctEnCurso}% del portafolio activo</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Colaboradores Activos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipo de Colaboradores</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
                    {stats.profesionalesActivos} <span className="text-sm font-normal text-gray-400">activos</span>
                  </h3>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  👥
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-purple-600 font-bold">
                  {stats.totalProfesionales} Profesionales en total
                </span>
                <span className="text-gray-400">Personal</span>
              </div>
            </div>

            {/* KPI 4: Consumo Horas Hombre */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Horas Hombre (HH Real)</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
                    {stats.totalHHReales.toLocaleString()} <span className="text-xs font-normal text-gray-400">hrs</span>
                  </h3>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  ⏱️
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className={`font-bold ${stats.desviacionHoras > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {stats.porcentajeCumplimiento.toFixed(1)}% Cumplimiento HH
                </span>
                <span className="text-gray-400">Plan: {stats.totalHHPlan.toLocaleString()}h</span>
              </div>
            </div>
          </div>

          {/* Gráficos Visuales y Desglose de Estado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Estado del Portafolio de Proyectos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span>📊</span> Estado de Proyectos
                </h3>
                <p className="text-xs text-gray-500 mb-6">Distribución por fase actual de trabajo</p>

                <div className="space-y-4">
                  {/* En Curso */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        En Curso ({proyectosEnCurso})
                      </span>
                      <span className="font-bold text-gray-900">{pctEnCurso}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctEnCurso}%` }} />
                    </div>
                  </div>

                  {/* Completada */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                        Completadas ({proyectosCompletados})
                      </span>
                      <span className="font-bold text-gray-900">{pctCompletados}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pctCompletados}%` }} />
                    </div>
                  </div>

                  {/* Standby */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        Standby ({proyectosStandby})
                      </span>
                      <span className="font-bold text-gray-900">{pctStandby}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pctStandby}%` }} />
                    </div>
                  </div>

                  {/* No Iniciadas */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                        No Iniciadas ({proyectosNoIniciados})
                      </span>
                      <span className="font-bold text-gray-900">{pctNoIniciados}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gray-400 h-full rounded-full" style={{ width: `${pctNoIniciados}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate('/fichas-proyecto')}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 font-bold text-xs rounded-xl transition-colors text-center block"
                >
                  Ver Fichas de Proyecto →
                </button>
              </div>
            </div>

            {/* Comparativa de Horas Hombre Ejecutadas vs Planificadas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>📈</span> Desempeño y Horas Hombre (HH)
                    </h3>
                    <p className="text-xs text-gray-500">Ejecución acumulada vs Planificación presupuestada</p>
                  </div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${stats.desviacionHoras > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    Desviación: {stats.desviacionHoras >= 0 ? '+' : ''}{stats.desviacionHoras.toLocaleString()} hrs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-700 font-semibold">Total HH Ejecutadas (Real)</p>
                    <p className="text-2xl font-black text-indigo-900 mt-1">{stats.totalHHReales.toLocaleString()} hrs</p>
                    <p className="text-xs text-indigo-600 mt-1">Horas trabajadas por colaboradores</p>
                  </div>

                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs text-purple-700 font-semibold">Total HH Presupuestadas (Plan)</p>
                    <p className="text-2xl font-black text-purple-900 mt-1">{stats.totalHHPlan.toLocaleString()} hrs</p>
                    <p className="text-xs text-purple-600 mt-1">Horas proyectadas en presupuesto</p>
                  </div>
                </div>

                {/* Progress bar visual de HH */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                    <span>Barra de Avance Global HH</span>
                    <span>{stats.porcentajeCumplimiento.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${stats.porcentajeCumplimiento > 100 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`} 
                      style={{ width: `${Math.min(stats.porcentajeCumplimiento, 100)}%` }} 
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 text-center">
                    {stats.porcentajeCumplimiento > 100 
                      ? '⚠️ El consumo real sobrepasa el presupuesto planificado.' 
                      : '✅ El consumo de horas está dentro del rango planificado.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => navigate('/dashboard-proyectos')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Abrir Dashboard HH Detallado →
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Proyectos Destacados (Mayor HH Real) */}
          {proyectosTopHH.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🏆</span> Proyectos con Mayor Consumo de HH
                  </h3>
                  <p className="text-xs text-gray-500">Top 5 proyectos en horas ejecutadas</p>
                </div>
                <button
                  onClick={() => navigate('/fichas-proyecto')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Ver todos →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/80 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 rounded-l-xl">Proyecto</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3 text-center">HH Plan</th>
                      <th className="px-4 py-3 text-center">HH Real</th>
                      <th className="px-4 py-3 text-center">Desviación</th>
                      <th className="px-4 py-3 text-center rounded-r-xl">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {proyectosTopHH.map((proyecto) => {
                      const desviacion = (proyecto.hhReal || 0) - (proyecto.hhPlanificadas || 0);
                      return (
                        <tr key={proyecto.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-gray-900">
                            {proyecto.nombreProyecto}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {proyecto.cliente || '-'}
                          </td>
                          <td className="px-4 py-3.5 text-center text-gray-500">
                            {proyecto.hhPlanificadas || 0} hrs
                          </td>
                          <td className="px-4 py-3.5 text-center font-extrabold text-indigo-600">
                            {proyecto.hhReal || 0} hrs
                          </td>
                          <td className={`px-4 py-3.5 text-center font-bold ${desviacion > 0 ? 'text-red-500' : desviacion < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {desviacion > 0 ? '+' : ''}{desviacion} hrs
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                              proyecto.estado === 'En Curso' ? 'bg-emerald-100 text-emerald-800' :
                              proyecto.estado === 'Completada' ? 'bg-blue-100 text-blue-800' :
                              proyecto.estado === 'Standby' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {proyecto.estado || 'No Iniciada'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menú de Acceso Rápido a Módulos (Botonera Horizontal) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📍</span> Accesos Rápidos a Módulos de Gestión
              </h3>
              <span className="text-xs text-gray-400">Menú siempre disponible en la ☰ hamburguesa</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {modulesQuickLinks.map((mod, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(mod.route)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all text-center group cursor-pointer"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{mod.icon}</span>
                  <span className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {mod.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;