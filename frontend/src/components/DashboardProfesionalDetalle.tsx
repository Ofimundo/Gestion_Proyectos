// src/components/DashboardProfesionalDetalle.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../services/api';

interface Profesional {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  activo: boolean;
  horasDisponibles: number;
  horasAsignadasMes?: { [mes: string]: number };
  proyectosAsignados?: ProyectoAsignado[];
}

interface ProyectoAsignado {
  solicitudId: string;
  nombreProyecto: string;
  nombreSolicitante: string;
  area: string;
  estimacionHoras: number;
  fechaAsignacion: string;
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  estado: string;
  profesionalId: string;
  profesionalNombre: string;
}


const DashboardProfesionalDetalle: React.FC = () => {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth());
  const [anoSeleccionado, setAnoSeleccionado] = useState<number>(new Date().getFullYear());

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  // Cargar datos desde la API
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar profesionales desde la API
      const profesionalesResponse = await api.get('/profesionales');
      if (profesionalesResponse.data.success) {
        setProfesionales(profesionalesResponse.data.data || []);
      }

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    
    const handleSolicitudesUpdate = () => {
      cargarDatos();
    };
    
    window.addEventListener('solicitudes-updated', handleSolicitudesUpdate);
    
    return () => {
      window.removeEventListener('solicitudes-updated', handleSolicitudesUpdate);
    };
  }, []);

  const getIniciales = (nombre: string): string => {
    const palabras = nombre.split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const getColorPorPorcentaje = (porcentaje: number): string => {
    if (porcentaje <= 100) return 'text-green-600';
    if (porcentaje <= 150) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColorPorPorcentaje = (porcentaje: number): string => {
    if (porcentaje <= 100) return 'bg-green-500';
    if (porcentaje <= 150) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Obtener profesionales activos
  const profesionalesActivos = profesionales.filter(p => p.activo);
  
  // Obtener profesional seleccionado
  const profesionalData = profesionalSeleccionado === 'todos' 
    ? null 
    : profesionalesActivos.find(p => p.id === profesionalSeleccionado);

  // Obtener proyectos asignados al profesional seleccionado
  const getProyectosAsignados = () => {
    if (profesionalSeleccionado === 'todos') {
      // Para todos los profesionales, agrupar por profesional
      const resultado: { [profesionalId: string]: { profesional: Profesional; proyectos: ProyectoAsignado[]; totalHoras: number } } = {};
      
      profesionalesActivos.forEach(prof => {
        if (prof.proyectosAsignados && prof.proyectosAsignados.length > 0) {
          resultado[prof.id] = {
            profesional: prof,
            proyectos: prof.proyectosAsignados,
            totalHoras: prof.proyectosAsignados.reduce((sum, p) => sum + p.estimacionHoras, 0)
          };
        }
      });
      
      return resultado;
    } else if (profesionalData) {
      return {
        [profesionalData.id]: {
          profesional: profesionalData,
          proyectos: profesionalData.proyectosAsignados || [],
          totalHoras: (profesionalData.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0)
        }
      };
    }
    return {};
  };

  const proyectosAsignadosMap = getProyectosAsignados();

  const exportarExcel = () => {
    const dataToExport: any[] = [
      ['DASHBOARD POR PROFESIONAL'],
      [`Fecha de corte: ${new Date().toLocaleDateString()}`],
      [''],
    ];

    if (profesionalSeleccionado === 'todos') {
      dataToExport.push(['RESUMEN GENERAL DE TODOS LOS PROFESIONALES']);
      dataToExport.push([]);
      dataToExport.push(['Profesional', 'Cargo', 'Horas Asignadas', 'Horas Disponibles', '% Asignación', 'Cantidad Proyectos']);
      
      profesionalesActivos.forEach(prof => {
        const horasAsignadas = (prof.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0);
        const porcentaje = (horasAsignadas / (prof.horasDisponibles || 168)) * 100;
        dataToExport.push([
          prof.nombre,
          prof.cargo,
          horasAsignadas,
          prof.horasDisponibles || 168,
          `${porcentaje.toFixed(1)}%`,
          (prof.proyectosAsignados || []).length
        ]);
      });
      
      dataToExport.push([]);
      dataToExport.push(['DETALLE DE PROYECTOS POR PROFESIONAL']);
      
      profesionalesActivos.forEach(prof => {
        if (prof.proyectosAsignados && prof.proyectosAsignados.length > 0) {
          dataToExport.push([]);
          dataToExport.push([`PROFESIONAL: ${prof.nombre} (${prof.cargo})`]);
          dataToExport.push(['Proyecto', 'Solicitante', 'Área', 'Horas Asignadas', 'Fecha Asignación', 'Estado']);
          
          prof.proyectosAsignados.forEach(proy => {
            dataToExport.push([
              proy.nombreProyecto,
              proy.nombreSolicitante,
              proy.area,
              proy.estimacionHoras,
              proy.fechaAsignacion,
              proy.estado
            ]);
          });
        }
      });
    } else if (profesionalData) {
      dataToExport.push([`RESUMEN DEL PROFESIONAL: ${profesionalData.nombre}`]);
      dataToExport.push([]);
      dataToExport.push(['Cargo', profesionalData.cargo]);
      dataToExport.push(['Horas Disponibles', profesionalData.horasDisponibles]);
      dataToExport.push(['Horas Asignadas', (profesionalData.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0)]);
      dataToExport.push(['Cantidad Proyectos', (profesionalData.proyectosAsignados || []).length]);
      dataToExport.push([]);
      dataToExport.push(['DETALLE DE PROYECTOS ASIGNADOS']);
      dataToExport.push(['Proyecto', 'Solicitante', 'Área', 'Horas Asignadas', 'Fecha Asignación', 'Fecha Inicio', 'Fecha Fin', 'Estado']);
      
      (profesionalData.proyectosAsignados || []).forEach(proy => {
        dataToExport.push([
          proy.nombreProyecto,
          proy.nombreSolicitante,
          proy.area,
          proy.estimacionHoras,
          proy.fechaAsignacion,
          proy.fechaInicioEstimada,
          proy.fechaFinEstimada,
          proy.estado
        ]);
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard_Profesional');
    XLSX.writeFile(wb, `Dashboard_Profesional_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
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
            onClick={cargarDatos}
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs sm:text-sm font-medium rounded-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Dashboard por Colaborador</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportarExcel}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-md"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar a Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Colaborador</label>
              <select
                value={profesionalSeleccionado}
                onChange={(e) => setProfesionalSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Todos los colaboradores</option>
                {profesionalesActivos.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.nombre} - {prof.cargo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <select
                value={anoSeleccionado}
                onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {meses.map((mes, idx) => (
                  <option key={idx} value={idx}>{mes}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {profesionalSeleccionado === 'todos' ? '📊 Resumen General de Colaboradores' : `📊 Resumen de ${profesionalData?.nombre}`}
          </h2>
          
          {profesionalSeleccionado === 'todos' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas Asignadas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas Disponibles</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">% Asignación</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad Proyectos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profesionalesActivos.map(prof => {
                    const horasAsignadas = (prof.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0);
                    const horasDisponibles = prof.horasDisponibles || 168;
                    const porcentaje = (horasAsignadas / horasDisponibles) * 100;
                    const color = getColorPorPorcentaje(porcentaje);
                    const bgColor = getBgColorPorPorcentaje(porcentaje);
                    
                    return (
                      <tr key={prof.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setProfesionalSeleccionado(prof.id)}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-bold text-sm">{getIniciales(prof.nombre)}</span>
                            </div>
                            {prof.nombre}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{prof.cargo}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">{horasAsignadas} hrs</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{horasDisponibles} hrs</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${color}`}>{porcentaje.toFixed(1)}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div className={`h-1.5 rounded-full ${bgColor}`} style={{ width: `${Math.min(porcentaje, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-purple-600">{(prof.proyectosAsignados || []).length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : profesionalData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Horas Asignadas</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {(profesionalData.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0)} hrs
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Horas Disponibles</h3>
                <p className="text-2xl font-bold text-green-600">{profesionalData.horasDisponibles} hrs</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800">Cantidad Proyectos</h3>
                <p className="text-2xl font-bold text-purple-600">{(profesionalData.proyectosAsignados || []).length}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-800">% Asignación</h3>
                <p className={`text-2xl font-bold ${getColorPorPorcentaje(((profesionalData.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0) / (profesionalData.horasDisponibles || 168)) * 100)}`}>
                  {(((profesionalData.proyectosAsignados || []).reduce((sum, p) => sum + p.estimacionHoras, 0) / (profesionalData.horasDisponibles || 168)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Distribución de horas por mes */}
        {profesionalSeleccionado !== 'todos' && profesionalData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Distribución de Horas por Mes - {anoSeleccionado}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {meses.map(mes => (
                      <th key={mes} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">{mes.substring(0, 3)}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {meses.map((mes, idx) => {
                      const keyMes = `${anoSeleccionado}-${idx}`;
                      const horas = profesionalData.horasAsignadasMes?.[keyMes] || 0;
                      return (
                        <td key={mes} className="px-3 py-2 text-center text-sm">
                          <span className={`font-semibold ${horas > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {horas > 0 ? `${horas} hrs` : '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center text-sm font-bold text-indigo-600">
                      {Object.values(profesionalData.horasAsignadasMes || {}).reduce((sum, val) => sum + val, 0)} hrs
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lista de Proyectos Asignados */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 p-6 pb-0">
            {profesionalSeleccionado === 'todos' ? '📋 Proyectos Asignados por Colaborador' : `📋 Proyectos Asignados a ${profesionalData?.nombre}`}
          </h2>
          
          {Object.keys(proyectosAsignadosMap).length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-500">No hay proyectos asignados</p>
            </div>
          ) : (
            <div className="p-6">
              {profesionalSeleccionado === 'todos' ? (
                // Vista para todos los profesionales
                Object.values(proyectosAsignadosMap).map(({ profesional, proyectos, totalHoras }) => (
                  <div key={profesional.id} className="mb-8 last:mb-0">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {profesional.nombre}
                          <span className="ml-2 text-sm font-normal text-gray-500">({profesional.cargo})</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Total horas: </span>
                        <span className="font-bold text-blue-600">{totalHoras} hrs</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Asignadas</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fecha Asignación</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {proyectos.map(proy => (
                            <tr key={proy.solicitudId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">{proy.nombreProyecto}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{proy.nombreSolicitante}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{proy.area}</td>
                              <td className="px-3 py-2 text-center text-sm font-semibold text-purple-600">{proy.estimacionHoras} hrs</td>
                              <td className="px-3 py-2 text-center text-sm text-gray-600">{proy.fechaAsignacion}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  proy.estado === 'Asignado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {proy.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : profesionalData && (
                // Vista para un profesional específico
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Asignadas</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fecha Asignación</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fecha Fin</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(profesionalData.proyectosAsignados || []).map(proy => (
                        <tr key={proy.solicitudId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{proy.nombreProyecto}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{proy.nombreSolicitante}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{proy.area}</td>
                          <td className="px-3 py-2 text-center text-sm font-semibold text-purple-600">{proy.estimacionHoras} hrs</td>
                          <td className="px-3 py-2 text-center text-sm text-gray-600">{proy.fechaAsignacion}</td>
                          <td className="px-3 py-2 text-center text-sm text-gray-600">{proy.fechaInicioEstimada || '-'}</td>
                          <td className="px-3 py-2 text-center text-sm text-gray-600">{proy.fechaFinEstimada || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              proy.estado === 'Asignado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {proy.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            📌 Los datos mostrados corresponden a proyectos asignados desde la sección de gestión de profesionales.
            Haz clic en cualquier fila de la tabla de resumen para ver el detalle completo de un profesional específico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfesionalDetalle;