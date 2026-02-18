import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Proyecto {
  id: string;
  codigo: string;
  nombreProyecto: string;
  cliente: string;
  lider: string;
  descripcion: string;
  venta: number;
  hhImplementacion: number;
  hhPeriodo: number;
  recursos: string[];
  fechaInicio: string;
  fechaTermino: string;
  estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
  avance: number;
  hhPlanificadas: number;
  hhReal: number;
}

const DashboardProyectos: React.FC = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<string>('todos');
  const [timeRange, setTimeRange] = useState<'semanal' | 'mensual' | 'trimestral'>('mensual');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const fichasGuardadas = localStorage.getItem('rpa_fichas');
        if (fichasGuardadas) {
          const fichas = JSON.parse(fichasGuardadas);
          const proyectosMapeados: Proyecto[] = fichas.map((f: any) => ({
            id: f.id,
            codigo: f.codigo || 'SIN-CODIGO',
            nombreProyecto: f.nombreProyecto || 'Sin nombre',
            cliente: f.cliente || 'Sin cliente',
            lider: f.lider || 'Sin líder',
            descripcion: f.descripcion || '',
            venta: f.venta || 0,
            hhImplementacion: f.hhImplementacion || 0,
            hhPeriodo: f.hhPeriodo || 0,
            recursos: f.recursos || [],
            fechaInicio: f.fechaInicio || '',
            fechaTermino: f.fechaTermino || '',
            estado: f.estado || 'No Iniciada',
            avance: f.avance || 0,
            hhPlanificadas: f.hhPlanificadas || 0,
            hhReal: f.hhReal || 0
          }));
          setProyectos(proyectosMapeados);
        } else {
          setProyectos([]);
        }
      } catch (error) {
        console.error('Error cargando proyectos:', error);
        setProyectos([]);
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

  const filteredProyectos = selectedProyecto === 'todos' 
    ? proyectos 
    : proyectos.filter(p => p.id === selectedProyecto);

  const totalHHPlanificadas = proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0), 0);
  const totalHHReales = proyectos.reduce((sum, p) => sum + (p.hhReal || 0), 0);
  const totalVenta = proyectos.reduce((sum, p) => sum + (p.venta || 0), 0);
  const proyectosEnCurso = proyectos.filter(p => p.estado === 'En Curso').length;
  const proyectosCompletados = proyectos.filter(p => p.estado === 'Completada').length;
  const proyectosStandby = proyectos.filter(p => p.estado === 'Standby').length;
  const proyectosNoIniciados = proyectos.filter(p => p.estado === 'No Iniciada').length;

  const horasData = {
    labels: filteredProyectos.map(p => p.codigo),
    datasets: [
      {
        label: 'HH Planificadas',
        data: filteredProyectos.map(p => p.hhPlanificadas || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      },
      {
        label: 'HH Reales',
        data: filteredProyectos.map(p => p.hhReal || 0),
        backgroundColor: 'rgba(236, 72, 153, 0.5)',
        borderColor: 'rgb(236, 72, 153)',
        borderWidth: 1
      }
    ]
  };

  const ventasData = {
    labels: filteredProyectos.map(p => p.codigo),
    datasets: [
      {
        label: 'Venta ($)',
        data: filteredProyectos.map(p => p.venta || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const estadoData = {
    labels: ['En Curso', 'Completada', 'Standby', 'No Iniciada'],
    datasets: [
      {
        data: [proyectosEnCurso, proyectosCompletados, proyectosStandby, proyectosNoIniciados],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(156, 163, 175)'
        ],
        borderWidth: 1
      }
    ]
  };

  const evolucionData = {
    labels: timeRange === 'semanal' 
      ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
      : timeRange === 'mensual'
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
      : ['T1', 'T2', 'T3', 'T4'],
    datasets: [
      {
        label: 'HH Planificadas',
        data: timeRange === 'semanal' 
          ? [proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 4, 0), 
             proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 4, 0),
             proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 4, 0),
             proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 4, 0)]
          : timeRange === 'mensual'
          ? Array(6).fill(proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 6, 0))
          : Array(4).fill(proyectos.reduce((sum, p) => sum + (p.hhPlanificadas || 0) / 4, 0)),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      },
      {
        label: 'HH Reales',
        data: timeRange === 'semanal'
          ? [proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 4, 0),
             proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 4, 0),
             proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 4, 0),
             proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 4, 0)]
          : timeRange === 'mensual'
          ? Array(6).fill(proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 6, 0))
          : Array(4).fill(proyectos.reduce((sum, p) => sum + (p.hhReal || 0) / 4, 0)),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: 10
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-indigo-600 mr-2 sm:mr-4 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xs:inline">Volver</span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Dashboard Proyectos
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Filtros */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col xs:flex-row gap-2 sm:gap-4">
          <select
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
            className="w-full xs:w-auto px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="todos">Todos los proyectos</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id} className="truncate">
                {p.codigo} - {p.nombreProyecto}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="w-full xs:w-auto px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </div>

        {/* Tarjetas de KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">HH Plan</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900">
                  {totalHHPlanificadas}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Venta</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900">
                  ${totalVenta.toLocaleString()}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Activos</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900">
                  {proyectosEnCurso}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Rendimiento</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900">
                  {totalHHPlanificadas > 0 ? ((totalHHReales / totalHHPlanificadas) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">
              Horas por Proyecto
            </h3>
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              {filteredProyectos.length > 0 ? (
                <Bar data={horasData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  No hay datos
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">
              Ventas por Proyecto
            </h3>
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              {filteredProyectos.length > 0 ? (
                <Bar data={ventasData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  No hay datos
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">
              Distribución por Estado
            </h3>
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              {proyectos.length > 0 ? (
                <Pie data={estadoData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  No hay datos
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">
              Evolución de Horas
            </h3>
            <div className="h-48 sm:h-64 md:h-72 lg:h-80">
              {proyectos.length > 0 ? (
                <Line data={evolucionData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  No hay datos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de proyectos */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
              Detalle de Proyectos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Proyecto
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Cliente
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    HH Plan
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Avance
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProyectos.length > 0 ? (
                  filteredProyectos.map((proyecto) => (
                    <tr key={proyecto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap font-medium">
                        {proyecto.codigo}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                        {proyecto.nombreProyecto}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap hidden md:table-cell">
                        {proyecto.cliente}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-green-600 font-medium">
                        ${proyecto.venta?.toLocaleString() || 0}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap hidden lg:table-cell">
                        {proyecto.hhPlanificadas || 0}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-8 sm:w-12 md:w-16 h-1.5 sm:h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-1.5 sm:h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                              style={{ width: `${proyecto.avance || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm">{proyecto.avance || 0}%</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                          proyecto.estado === 'En Curso' ? 'bg-green-100 text-green-800' :
                          proyecto.estado === 'Completada' ? 'bg-blue-100 text-blue-800' :
                          proyecto.estado === 'Standby' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proyecto.estado === 'En Curso' ? 'Curso' : 
                           proyecto.estado === 'Completada' ? 'Compl' : 
                           proyecto.estado === 'Standby' ? 'Stand' : 'No Ini'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-400">
                      No hay proyectos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardProyectos;