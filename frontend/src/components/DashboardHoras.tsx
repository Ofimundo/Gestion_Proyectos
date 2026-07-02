import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Profesional {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  activo: boolean;
  horasDisponibles: number;
  horasAsignadasMes?: { [mes: string]: number };
  horario?: any;
  proyectosAsignados?: any[];
}

interface SolicitudProyecto {
  id: string;
  nombreProyecto: string;
  nombreSolicitante: string;
  area: string;
  estado: string;
  profesionalesAsignados?: { profesionalId: string; profesionalNombre: string; estimacionHoras: number; fechaAsignacion: string }[];
  estimacionHorasTotal?: number;
  fechaInicio?: string;
}



const DashboardHoras: React.FC = () => {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudProyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getIniciales = (nombre: string): string => {
    const palabras = nombre.split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  // Calcular horas totales del proyecto (suma de horas asignadas a profesionales)
  const getHorasTotalesProyecto = (solicitud: SolicitudProyecto): number => {
    return solicitud.estimacionHorasTotal || 0;
  };



  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar profesionales desde la API
        const profesionalesResponse = await api.get('/profesionales');
        if (profesionalesResponse.data.success) {
          setProfesionales(profesionalesResponse.data.data || []);
        }

        // Cargar solicitudes desde la API (todas, para filtrar después)
        const solicitudesResponse = await api.get('/solicitudes');
        if (solicitudesResponse.data.success) {
          setSolicitudes(solicitudesResponse.data.data || []);
        }


      } catch (err: any) {
        console.error('Error cargando datos:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    // Escuchar cambios en solicitudes
    const handleSolicitudesUpdate = () => {
      cargarDatos();
    };

    window.addEventListener('solicitudes-updated', handleSolicitudesUpdate);

    return () => {
      window.removeEventListener('solicitudes-updated', handleSolicitudesUpdate);
    };
  }, []);

  // Calcular datos para la tabla
  const calcularDatos = () => {
    const profesionalesActivos = profesionales.filter(p => p.activo);
    
    // Incluir proyectos aprobados que tengan profesionales asignados
    const proyectosActivos = solicitudes.filter(s => {
      const tieneProfesionales = s.profesionalesAsignados && s.profesionalesAsignados.length > 0;
      return (s.estado === 'Aprobado' || s.estado === 'En Revision') && tieneProfesionales;
    });
    
    // Mapa de profesionales con sus horas totales asignadas
    const mapaProfesionales: { [key: string]: { id: string; nombre: string; inicial: string; horas: number; horasDisponibles: number; cargo: string; sobrecarga: number } } = {};
    
    profesionalesActivos.forEach(prof => {
      // Calcular horas totales asignadas desde horasAsignadasMes o desde proyectosAsignados
      let totalHorasAsignadas = 0;
      
      // Método 1: Desde horasAsignadasMes (estructura mensual)
      if (prof.horasAsignadasMes) {
        const mesActual = `${new Date().getFullYear()}-${new Date().getMonth()}`;
        totalHorasAsignadas = prof.horasAsignadasMes[mesActual] || 0;
      }
      
      // Método 2: Desde proyectosAsignados (sumar todas las horas)
      if (prof.proyectosAsignados && prof.proyectosAsignados.length > 0) {
        const horasDesdeProyectos = prof.proyectosAsignados.reduce((sum, p) => sum + (p.estimacionHoras || 0), 0);
        if (horasDesdeProyectos > totalHorasAsignadas) {
          totalHorasAsignadas = horasDesdeProyectos;
        }
      }
      
      mapaProfesionales[prof.id] = {
        id: prof.id,
        nombre: prof.nombre,
        inicial: getIniciales(prof.nombre),
        horas: totalHorasAsignadas,
        horasDisponibles: prof.horasDisponibles || 168,
        cargo: prof.cargo,
        sobrecarga: totalHorasAsignadas > (prof.horasDisponibles || 168) ? totalHorasAsignadas - (prof.horasDisponibles || 168) : 0
      };
    });
    
    // Datos por proyecto usando profesionalesAsignados
    const datosProyectos: Array<{
      id: string;
      nombre: string;
      horasTotales: number;
      porcentajes: { [key: string]: number };
      horasAsignadas: { [key: string]: number };
    }> = [];
    
    proyectosActivos.forEach(proyecto => {
      const horasTotales = getHorasTotalesProyecto(proyecto);
      const profesionalesAsignados = proyecto.profesionalesAsignados || [];
      
      if (profesionalesAsignados.length === 0) return;
      
      // Obtener horas asignadas por profesional para este proyecto
      const distribucionHoras: { [key: string]: number } = {};
      
      profesionalesAsignados.forEach(asignacion => {
        const profesional = profesionalesActivos.find(p => p.id === asignacion.profesionalId);
        if (profesional) {
          const inicial = getIniciales(profesional.nombre);
          distribucionHoras[inicial] = (distribucionHoras[inicial] || 0) + (asignacion.estimacionHoras || 0);
        }
      });
      
      // Calcular porcentajes por proyecto
      const porcentajes: { [key: string]: number } = {};
      const keys = Object.keys(distribucionHoras);
      for (let i = 0; i < keys.length; i++) {
        const inicial = keys[i];
        if (horasTotales > 0) {
          porcentajes[inicial] = (distribucionHoras[inicial] / horasTotales) * 100;
        }
      }
      
      datosProyectos.push({
        id: proyecto.id,
        nombre: proyecto.nombreProyecto,
        horasTotales: horasTotales,
        porcentajes: porcentajes,
        horasAsignadas: distribucionHoras
      });
    });
    
    const listaProfesionales = Object.values(mapaProfesionales).map(prof => ({
      id: prof.id,
      nombre: prof.nombre,
      inicial: prof.inicial,
      horas: prof.horas,
      horasDisponibles: prof.horasDisponibles,
      cargo: prof.cargo,
      sobrecarga: prof.sobrecarga
    }));
    
    return { datosProyectos, listaProfesionales };
  };

  const { datosProyectos, listaProfesionales } = calcularDatos();
  
  // Calcular totales globales
  const totalHorasGlobal = listaProfesionales.reduce((sum, p) => sum + p.horas, 0);
  const totalHorasDisponibles = listaProfesionales.reduce((sum, p) => sum + p.horasDisponibles, 0);

  const getPorcentajeAsignacion = (horas: number, horasDisponibles: number): number => {
    if (horasDisponibles === 0) return 0;
    return (horas / horasDisponibles) * 100;
  };

  const getColorPorPorcentaje = (porcentaje: number): string => {
    if (porcentaje <= 100) return 'text-green-600';
    if (porcentaje <= 150) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToExcel = () => {
    const profesionalesIniciales = listaProfesionales.map(p => p.inicial);
    const profesionalesNombres = listaProfesionales.map(p => p.nombre);
    
    const dataToExport: any[] = [
      ['DASHBOARD DE DISTRIBUCIÓN DE HORAS'],
      [`Fecha de corte: ${new Date().toLocaleDateString()}`],
      [''],
      ['', ...profesionalesNombres, 'HH del Proyecto', '% total por proyecto', 'Horas trabajadas mes'],
      ['N°', 'NOMBRE PROYECTOS', ...profesionalesIniciales, '', '', ''],
    ];
    
    for (let i = 0; i < datosProyectos.length; i++) {
      const proyecto = datosProyectos[i];
      const fila: any[] = [i + 1, proyecto.nombre];
      let totalPorcentaje = 0;
      let totalHorasProyecto = 0;
      
      for (let j = 0; j < listaProfesionales.length; j++) {
        const prof = listaProfesionales[j];
        const porcentaje = proyecto.porcentajes[prof.inicial];
        const horas = proyecto.horasAsignadas[prof.inicial];
        if (porcentaje && porcentaje > 0) {
          fila.push(`${porcentaje.toFixed(1)}% (${horas}h)`);
          totalPorcentaje += porcentaje;
          totalHorasProyecto += horas || 0;
        } else {
          fila.push('-');
        }
      }
      
      fila.push(`${proyecto.horasTotales} hrs`);
      fila.push(`${totalPorcentaje.toFixed(1)}%`);
      fila.push(`${totalHorasProyecto} hrs`);
      dataToExport.push(fila);
    }
    
    dataToExport.push(['', '', '', '', '', '', '']);
    
    const filaAsignacion = ['% de asignación (vs horas disponibles)', ...listaProfesionales.map(p => `${getPorcentajeAsignacion(p.horas, p.horasDisponibles).toFixed(1)}%`), '', '', ''];
    const filaHoras = ['Horas asignadas', ...listaProfesionales.map(p => `${p.horas} hrs`), '', '', ''];
    const filaDisponibles = ['Horas disponibles', ...listaProfesionales.map(p => `${p.horasDisponibles} hrs`), '', '', ''];
    
    dataToExport.push(filaAsignacion);
    dataToExport.push(filaHoras);
    dataToExport.push(filaDisponibles);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    
    // Ajustar anchos de columnas
    const colWidths = [{ wch: 5 }, { wch: 35 }, ...profesionalesIniciales.map(() => ({ wch: 14 })), { wch: 15 }, { wch: 18 }, { wch: 18 }];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Distribucion_Horas');
    const fecha = new Date();
    const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}-${fecha.getDate().toString().padStart(2,'0')}`;
    XLSX.writeFile(wb, `Distribucion_Horas_${fechaStr}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
            onClick={() => window.location.reload()}
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
      {/* Header con botón volver */}
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Dashboard de Distribución de Horas</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
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
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Profesionales</h3>
            <p className="text-2xl font-bold text-gray-900">{listaProfesionales.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Horas Asignadas</h3>
            <p className="text-2xl font-bold text-blue-600">{totalHorasGlobal} hrs</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Horas Disponibles</h3>
            <p className="text-2xl font-bold text-green-600">{totalHorasDisponibles} hrs</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Proyectos Activos</h3>
            <p className="text-2xl font-bold text-purple-600">{datosProyectos.length}</p>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-green-600 to-teal-600">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-white sticky left-0 bg-gradient-to-r from-green-600 to-teal-600 w-12">N°</th>
                  <th className="px-3 py-3 text-left font-semibold text-white sticky left-0 bg-gradient-to-r from-green-600 to-teal-600 min-w-[200px]">NOMBRE PROYECTOS</th>
                  {listaProfesionales.map(prof => (
                    <th key={prof.id} className="px-2 py-3 text-center font-semibold text-white min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span>{prof.nombre.split(' ')[0]}</span>
                        <span className="text-xs font-normal text-gray-200">({prof.inicial})</span>
                        <span className="text-xs font-normal text-gray-200">{prof.cargo?.substring(0, 15)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center font-semibold text-white min-w-[100px]">HH del Proyecto</th>
                  <th className="px-2 py-3 text-center font-semibold text-white min-w-[110px]">% total por proyecto</th>
                  <th className="px-2 py-3 text-center font-semibold text-white min-w-[120px]">Horas trabajadas mes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosProyectos.length === 0 ? (
                  <tr>
                    <td colSpan={listaProfesionales.length + 4} className="px-4 py-8 text-center text-gray-400">
                      No hay proyectos aprobados con profesionales asignados
                    </td>
                  </tr>
                ) : (
                  datosProyectos.map((proyecto, idx) => {
                    let totalPorcentaje = 0;
                    let totalHorasAsignadas = 0;
                    for (let i = 0; i < listaProfesionales.length; i++) {
                      const prof = listaProfesionales[i];
                      const porcentaje = proyecto.porcentajes[prof.inicial];
                      const horas = proyecto.horasAsignadas[prof.inicial];
                      if (porcentaje) {
                        totalPorcentaje += porcentaje;
                      }
                      if (horas) {
                        totalHorasAsignadas += horas;
                      }
                    }
                    return (
                      <tr key={proyecto.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white text-center">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white">{proyecto.nombre}</td>
                        {listaProfesionales.map(prof => {
                          const porcentaje = proyecto.porcentajes[prof.inicial];
                          const horas = proyecto.horasAsignadas[prof.inicial];
                          return (
                            <td key={prof.id} className="px-2 py-2 text-center">
                              {porcentaje && porcentaje > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-purple-600 font-semibold text-sm">{porcentaje.toFixed(1)}%</span>
                                  <span className="text-xs text-gray-500">{horas}h</span>
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center text-green-600 font-semibold">{proyecto.horasTotales} hrs</td>
                        <td className="px-2 py-2 text-center">
                          <span className={`font-semibold ${totalPorcentaje === 100 ? 'text-blue-600' : totalPorcentaje > 100 ? 'text-red-600' : 'text-orange-600'}`}>
                            {totalPorcentaje.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-orange-600 font-semibold">{totalHorasAsignadas} hrs</td>
                      </tr>
                    );
                  })
                )}
                
                {/* Fila de totales por profesional */}
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td colSpan={2} className="px-3 py-2 font-bold text-gray-700">Horas asignadas por profesional</td>
                  {listaProfesionales.map(prof => (
                    <td key={prof.id} className="px-2 py-2 text-center font-bold text-blue-600">
                      {prof.horas} hrs
                    </td>
                  ))}
                  <td colSpan={3} className="px-3 py-2"></td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan={2} className="px-3 py-2 font-bold text-gray-700">Horas disponibles por profesional</td>
                  {listaProfesionales.map(prof => (
                    <td key={prof.id} className="px-2 py-2 text-center font-bold text-green-600">
                      {prof.horasDisponibles} hrs
                    </td>
                  ))}
                  <td colSpan={3} className="px-3 py-2"></td>
                </tr>
                <tr className={`${listaProfesionales.some(p => p.sobrecarga > 0) ? 'bg-red-50' : 'bg-gray-100'}`}>
                  <td colSpan={2} className="px-3 py-2 font-bold text-gray-700">% de asignación (vs horas disponibles)</td>
                  {listaProfesionales.map(prof => {
                    const porcentaje = getPorcentajeAsignacion(prof.horas, prof.horasDisponibles);
                    const color = getColorPorPorcentaje(porcentaje);
                    return (
                      <td key={prof.id} className={`px-2 py-2 text-center font-bold ${color}`}>
                        {porcentaje.toFixed(1)}%
                        {porcentaje > 100 && (
                          <div className="text-xs text-red-500">⚠️ +{prof.sobrecarga} hrs</div>
                        )}
                      </td>
                    );
                  })}
                  <td colSpan={3} className="px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tarjetas de profesionales */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Resumen por Profesional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {listaProfesionales.map(prof => {
              const horas = prof.horas;
              const horasDisponibles = prof.horasDisponibles;
              const porcentaje = getPorcentajeAsignacion(horas, horasDisponibles);
              const color = getColorPorPorcentaje(porcentaje);
              const sobrecarga = prof.sobrecarga;
              
              return (
                <div key={prof.id} className={`bg-white rounded-lg shadow-md p-4 border ${porcentaje > 100 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {prof.inicial}
                    </div>
                    <div className="ml-2">
                      <h4 className="font-medium text-gray-900 text-sm">{prof.nombre}</h4>
                      <p className="text-xs text-gray-500">{prof.cargo}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Horas asignadas:</span>
                      <span className="font-semibold text-blue-600">{horas} hrs</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Horas disponibles:</span>
                      <span className="font-semibold text-green-600">{horasDisponibles} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${porcentaje > 100 ? 'bg-red-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Asignación:</span>
                      <span className={`font-semibold ${color}`}>
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                    {sobrecarga > 0 && (
                      <div className="mt-1 p-1 bg-red-100 rounded text-center">
                        <span className="text-xs text-red-600 font-semibold">
                          ⚠️ Sobrecarga: +{sobrecarga} hrs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {listaProfesionales.some(p => p.sobrecarga > 0) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <span className="font-semibold">⚠️ Alerta de sobrecarga:</span> Algunos profesionales tienen más horas asignadas que las disponibles. 
              Se recomienda redistribuir las horas o ajustar las horas disponibles de los profesionales.
            </p>
          </div>
        )}

        {/* Nota informativa */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            📌 Los datos mostrados corresponden a proyectos con estado <strong>Aprobado</strong> o <strong>En Revisión</strong> que tienen profesionales asignados.
            Las horas se calculan automáticamente desde la sección de asignación de proyectos en la gestión de profesionales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHoras;