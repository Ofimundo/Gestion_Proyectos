// src/components/Profesionales.tsx
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
  horario: {
    lunes: { activo: boolean; entrada: string; salida: string };
    martes: { activo: boolean; entrada: string; salida: string };
    miercoles: { activo: boolean; entrada: string; salida: string };
    jueves: { activo: boolean; entrada: string; salida: string };
    viernes: { activo: boolean; entrada: string; salida: string };
    sabado: { activo: boolean; entrada: string; salida: string };
    domingo: { activo: boolean; entrada: string; salida: string };
  };
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

interface SolicitudProyecto {
  id: string;
  nombreProyecto: string;
  nombreSolicitante: string;
  area: string;
  estado: string;
  email?: string;
  profesionalesAsignados?: { profesionalId: string; profesionalNombre: string; estimacionHoras: number; fechaAsignacion: string }[];
  estimacionHorasTotal?: number;
}

interface HorasAsignadas {
  [profesionalId: string]: {
    [mes: string]: number;
  };
}

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// Modal de confirmación personalizado
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', cancelText = 'Cancelar' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h3>
          <p className="text-center text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función para verificar si una fecha es feriado
const esFeriado = (fecha: Date, feriados: { mes: number; dia: number; nombre: string }[]): boolean => {
  return feriados.some(f => f.mes === fecha.getMonth() && f.dia === fecha.getDate());
};

const getDomingoPascua = (ano: number): Date => {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
};

const getViernesSanto = (ano: number): Date => {
  const pascua = getDomingoPascua(ano);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  return viernesSanto;
};

const getFeriadosChile = (ano: number): { mes: number; dia: number; nombre: string }[] => {
  const feriados: { mes: number; dia: number; nombre: string }[] = [
    { mes: 0, dia: 1, nombre: 'Año Nuevo' },
    { mes: 4, dia: 1, nombre: 'Día del Trabajo' },
    { mes: 8, dia: 18, nombre: 'Día de la Independencia' },
    { mes: 8, dia: 19, nombre: 'Día de las Glorias del Ejército' },
    { mes: 11, dia: 8, nombre: 'Inmaculada Concepción' },
    { mes: 11, dia: 25, nombre: 'Navidad' },
  ];

  const viernesSanto = getViernesSanto(ano);
  feriados.push({ mes: viernesSanto.getMonth(), dia: viernesSanto.getDate(), nombre: 'Viernes Santo' });
  
  const sanPedro = new Date(ano, 5, 29);
  if (sanPedro.getDay() !== 0) {
    feriados.push({ mes: 5, dia: 29, nombre: 'San Pedro y San Pablo' });
  }
  
  const asuncion = new Date(ano, 7, 15);
  if (asuncion.getDay() !== 0) {
    feriados.push({ mes: 7, dia: 15, nombre: 'Asunción de la Virgen' });
  }
  
  const fiestasPatrias2 = new Date(ano, 8, 20);
  if (fiestasPatrias2.getDay() !== 0) {
    feriados.push({ mes: 8, dia: 20, nombre: 'Fiestas Patrias (2do día)' });
  }
  
  const reformaProtestante = new Date(ano, 9, 31);
  if (reformaProtestante.getDay() !== 0) {
    feriados.push({ mes: 9, dia: 31, nombre: 'Día Nacional de las Iglesias Evangélicas' });
  }
  
  const todosSantos = new Date(ano, 10, 1);
  if (todosSantos.getDay() !== 0) {
    feriados.push({ mes: 10, dia: 1, nombre: 'Día de Todos los Santos' });
  }

  return feriados;
};

const getMaxHorasSemanales = (fecha: Date): number => {
  const fechaLey = new Date(fecha);
  const fecha44 = new Date(2024, 3, 26);
  const fecha42 = new Date(2026, 3, 26);
  const fecha40 = new Date(2028, 3, 26);
  
  if (fechaLey < fecha44) return 45;
  if (fechaLey < fecha42) return 44;
  if (fechaLey < fecha40) return 42;
  return 40;
};

const getLeyHorasTexto = (fecha: Date): string => {
  const fechaLey = new Date(fecha);
  const fecha44 = new Date(2024, 3, 26);
  const fecha42 = new Date(2026, 3, 26);
  const fecha40 = new Date(2028, 3, 26);
  
  if (fechaLey < fecha44) return "45 horas semanales (antes de Ley 40 horas)";
  if (fechaLey < fecha42) return "44 horas semanales (Ley 40 horas - Fase 1: desde 26 abril 2024)";
  if (fechaLey < fecha40) return "42 horas semanales (Ley 40 horas - Fase 2: desde 26 abril 2026)";
  return "40 horas semanales (Ley 40 horas - Fase 3: desde 26 abril 2028)";
};

const NotificationToast: React.FC<{ notification: Notification; onClose: (id: number) => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const bgColor = 
    notification.type === 'success' ? 'bg-green-500' : 
    notification.type === 'error' ? 'bg-red-500' : 
    notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  const icon = 
    notification.type === 'success' ? '✓' : 
    notification.type === 'error' ? '✕' : 
    notification.type === 'warning' ? '⚠' : 'ℹ';

  return (
    <div className={`${bgColor} text-white rounded-lg shadow-lg mb-3 p-4 flex items-start justify-between transform transition-all duration-300 animate-slide-in-right min-w-[300px] max-w-md`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white bg-opacity-30 flex items-center justify-center font-bold">
          {icon}
        </div>
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <button onClick={() => onClose(notification.id)} className="ml-4 text-white hover:text-gray-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ModalAsignarProyecto: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profesional: Profesional | null;
  proyectosDisponibles: SolicitudProyecto[];
  onAsignar: (profesionalId: string, proyectoId: string, estimacionHoras: number, fechaInicio: string, fechaFin: string) => void;
}> = ({ isOpen, onClose, profesional, proyectosDisponibles, onAsignar }) => {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [estimacionHoras, setEstimacionHoras] = useState(0);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');

  if (!isOpen || !profesional) return null;

  const calcularHorasDisponiblesRestantes = (): number => {
    const fechaActual = new Date();
    const mesActual = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}`;
    const horasAsignadasEsteMes = profesional.horasAsignadasMes?.[mesActual] || 0;
    const horasDisponibles = profesional.horasDisponibles;
    return horasDisponibles - horasAsignadasEsteMes;
  };

  const handleConfirm = () => {
    if (!proyectoSeleccionado) {
      alert('Debes seleccionar un proyecto');
      return;
    }
    if (estimacionHoras <= 0) {
      alert('Debes ingresar una estimación de horas válida');
      return;
    }
    
    const horasRestantes = calcularHorasDisponiblesRestantes();
    if (estimacionHoras > horasRestantes) {
      alert(`⚠️ El profesional solo tiene ${horasRestantes} horas disponibles este mes. No puede asignarse ${estimacionHoras} horas.`);
      return;
    }
    
    onAsignar(profesional.id, proyectoSeleccionado, estimacionHoras, fechaInicio, fechaFin);
  };

  const horasRestantes = calcularHorasDisponiblesRestantes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Asignar Proyecto a {profesional.nombre}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 mb-2">
            <p className="text-sm font-medium text-blue-800">📊 Disponibilidad del profesional</p>
            <p className="text-xs text-blue-700 mt-1">
              Horas totales del mes: <strong>{profesional.horasDisponibles} hrs</strong><br />
              Horas ya asignadas: <strong>{(profesional.horasAsignadasMes?.[`${new Date().getFullYear()}-${new Date().getMonth()}`] || 0)} hrs</strong><br />
              Horas disponibles: <strong className="text-green-600">{horasRestantes} hrs</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Proyecto *
            </label>
            <select
              value={proyectoSeleccionado}
              onChange={(e) => setProyectoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">-- Seleccione un proyecto --</option>
              {proyectosDisponibles.map(proyecto => {
                const horasAsignadasTotal = proyecto.profesionalesAsignados?.reduce((sum, p) => sum + p.estimacionHoras, 0) || 0;
                const yaAsignado = proyecto.profesionalesAsignados?.some(p => p.profesionalId === profesional.id) || false;
                return (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombreProyecto} - {proyecto.nombreSolicitante} ({proyecto.area}) - Estado: {proyecto.estado}
                    {proyecto.profesionalesAsignados && proyecto.profesionalesAsignados.length > 0 && 
                      ` (Asignado a: ${proyecto.profesionalesAsignados.map(p => p.profesionalNombre).join(', ')} - ${horasAsignadasTotal}/${proyecto.estimacionHorasTotal || '?'} hrs)`
                    }
                    {yaAsignado && " ⚠️ Ya está asignado a este proyecto"}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Mostrando proyectos en estado: Aprobado, Pendiente, En Revision
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas a asignar a este profesional *
            </label>
            <input
              type="number"
              value={estimacionHoras}
              onChange={(e) => setEstimacionHoras(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: 40"
              min="1"
              max={horasRestantes}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo disponible: {horasRestantes} horas
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio Estimada
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin Estimada
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-sm font-medium text-yellow-800">⚠️ Importante</p>
            <p className="text-xs text-yellow-700 mt-1">
              • Un mismo proyecto puede ser asignado a múltiples profesionales<br />
              • Las horas se descontarán automáticamente de la disponibilidad mensual<br />
              • Verifica que el profesional tenga disponibilidad suficiente
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Asignar Proyecto
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC<{ profesionales: Profesional[]; fechaActual: Date; setFechaActual: (date: Date) => void }> = ({ 
  profesionales, 
  fechaActual, 
  setFechaActual 
}) => {
  const [viewType, setViewType] = useState<'diario' | 'semanal' | 'mensual'>('semanal');
  const [selectedProfesional, setSelectedProfesional] = useState<string>('todos');

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getDiasDelMes = (ano: number, mes: number): Date[] => {
    const dias: Date[] = [];
    const fecha = new Date(ano, mes, 1);
    while (fecha.getMonth() === mes) {
      dias.push(new Date(fecha));
      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  };

  const getSemanaActual = (fecha: Date): Date[] => {
    const inicio = new Date(fecha);
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
    inicio.setDate(diff);
    
    const semana: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const diaSemana = new Date(inicio);
      diaSemana.setDate(inicio.getDate() + i);
      semana.push(diaSemana);
    }
    return semana;
  };

  const calcularHorasDiaEspecifico = (profesional: Profesional, fecha: Date): number => {
    const diaSemana = fecha.getDay();
    let diaKey = '';
    switch(diaSemana) {
      case 1: diaKey = 'lunes'; break;
      case 2: diaKey = 'martes'; break;
      case 3: diaKey = 'miercoles'; break;
      case 4: diaKey = 'jueves'; break;
      case 5: diaKey = 'viernes'; break;
      case 6: diaKey = 'sabado'; break;
      case 0: diaKey = 'domingo'; break;
      default: return 0;
    }
    
    const feriados = getFeriadosChile(fecha.getFullYear());
    const esFeriadoHoy = esFeriado(fecha, feriados);
    if (esFeriadoHoy) return 0;
    
    const horarioDia = profesional.horario[diaKey as keyof typeof profesional.horario];
    if (horarioDia && horarioDia.activo) {
      const [horaEntrada, minutoEntrada] = horarioDia.entrada.split(':').map(Number);
      const [horaSalida, minutoSalida] = horarioDia.salida.split(':').map(Number);
      let horas = horaSalida - horaEntrada;
      let minutos = minutoSalida - minutoEntrada;
      if (minutos < 0) {
        horas--;
        minutos += 60;
      }
      return horas + (minutos / 60);
    }
    return 0;
  };

  const profesionalesFiltrados = selectedProfesional === 'todos' 
    ? profesionales.filter(p => p.activo)
    : profesionales.filter(p => p.id === selectedProfesional && p.activo);

  const renderVistaDiaria = () => {
    const horasPorProfesional = profesionalesFiltrados.map(prof => ({
      nombre: prof.nombre,
      horas: calcularHorasDiaEspecifico(prof, fechaActual),
      cargo: prof.cargo
    }));

    const totalHorasDia = horasPorProfesional.reduce((sum, p) => sum + p.horas, 0);
    const feriados = getFeriadosChile(fechaActual.getFullYear());
    const esFeriadoHoy = esFeriado(fechaActual, feriados);
    const feriadoNombre = feriados.find(f => f.mes === fechaActual.getMonth() && f.dia === fechaActual.getDate())?.nombre;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {fechaActual.getDate()} de {meses[fechaActual.getMonth()]} de {fechaActual.getFullYear()}
          </h3>
          {esFeriadoHoy && (
            <div className="mt-2 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              🗓️ Feriado: {feriadoNombre}
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas del día</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {horasPorProfesional.map((prof, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prof.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prof.cargo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`font-semibold ${prof.horas > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {prof.horas > 0 ? `${prof.horas} hrs` : 'No laborable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-sm font-bold text-gray-700">Total del día</td>
                <td className="px-6 py-3 text-center text-sm font-bold text-indigo-600">{totalHorasDia} hrs</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderVistaSemanal = () => {
    const semana = getSemanaActual(fechaActual);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Semana del {semana[0].getDate()} de {meses[semana[0].getMonth()]} al {semana[6].getDate()} de {meses[semana[6].getMonth()]}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Profesional</th>
              {semana.map((dia, idx) => (
                <th key={idx} className="px-3 py-3 text-center text-xs font-medium text-white uppercase">
                  {diasSemana[idx]}<br />
                  <span className="text-xs opacity-90">{dia.getDate()}/{dia.getMonth()+1}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-white uppercase">Total Semana</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profesionalesFiltrados.map(prof => {
              let totalSemana = 0;
              const horasPorDia = semana.map(dia => {
                const horas = calcularHorasDiaEspecifico(prof, dia);
                totalSemana += horas;
                return horas;
              });
              
              const maxHoras = getMaxHorasSemanales(fechaActual);
              const excedeLimite = totalSemana > maxHoras;
              
              return (
                <tr key={prof.id} className={`hover:bg-gray-50 ${excedeLimite ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prof.nombre}
                    {excedeLimite && (
                      <div className="text-xs text-red-500">⚠️ Excede {maxHoras}h</div>
                    )}
                  </td>
                  {horasPorDia.map((horas, idx) => (
                    <td key={idx} className="px-3 py-3 whitespace-nowrap text-sm text-center">
                      <span className={horas > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {horas > 0 ? `${horas}` : '-'}
                      </span>
                    </td>
                  ))}
                  <td className={`px-3 py-3 whitespace-nowrap text-sm text-center font-bold ${excedeLimite ? 'text-red-600' : 'text-indigo-600'}`}>
                    {totalSemana.toFixed(1)} hrs
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-gray-700">Total por día</td>
              {semana.map((_, idx) => {
                let totalDia = 0;
                profesionalesFiltrados.forEach(prof => {
                  totalDia += calcularHorasDiaEspecifico(prof, semana[idx]);
                });
                return (
                  <td key={idx} className="px-3 py-3 text-sm text-center font-bold text-indigo-600">
                    {totalDia.toFixed(1)} hrs
                  </td>
                );
              })}
              <td className="px-3 py-3 text-sm text-center font-bold text-indigo-600">
                {profesionalesFiltrados.reduce((sum, prof) => {
                  let total = 0;
                  semana.forEach(dia => {
                    total += calcularHorasDiaEspecifico(prof, dia);
                  });
                  return sum + total;
                }, 0).toFixed(1)} hrs
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderVistaMensual = () => {
    const diasDelMes = getDiasDelMes(fechaActual.getFullYear(), fechaActual.getMonth());
    const maxHoras = getMaxHorasSemanales(fechaActual);
    
    // Obtener feriados
    const feriados = getFeriadosChile(fechaActual.getFullYear());
    
    // Calcular días vacíos al inicio (para alinear con el día de la semana)
    const primerDia = diasDelMes[0];
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const diasVaciosInicio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    // Calcular días vacíos al final (para completar la última semana)
    const ultimoDia = diasDelMes[diasDelMes.length - 1];
    const ultimoDiaSemana = ultimoDia.getDay();
    const diasVaciosFin = ultimoDiaSemana === 0 ? 0 : 7 - ultimoDiaSemana;
    
    // Crear array con todas las celdas (vacías + días del mes)
    const celdas: { tipo: 'vacio' | 'dia'; fecha?: Date }[] = [];
    
    for (let i = 0; i < diasVaciosInicio; i++) {
      celdas.push({ tipo: 'vacio' });
    }
    
    diasDelMes.forEach(dia => {
      celdas.push({ tipo: 'dia', fecha: dia });
    });
    
    for (let i = 0; i < diasVaciosFin; i++) {
      celdas.push({ tipo: 'vacio' });
    }
    
    // Calcular el total mensual general de horas y totales por profesional
    const profesionalesConTotales = profesionalesFiltrados.map(prof => {
      let totalMes = 0;
      const horasPorDia = diasDelMes.map(dia => {
        const horas = calcularHorasDiaEspecifico(prof, dia);
        totalMes += horas;
        return horas;
      });
      return { ...prof, totalMes, horasPorDia };
    });

    const totalHorasMensualGeneral = profesionalesConTotales.reduce((sum, prof) => sum + prof.totalMes, 0);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 capitalize">
              {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ley vigente: {getLeyHorasTexto(fechaActual)} (máximo {maxHoras} horas/semana)
            </p>
          </div>
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            Total Mensual: {totalHorasMensualGeneral.toFixed(1)} hrs
          </div>
        </div>

        {/* Advertencias de exceso de horas semanales */}
        {profesionalesConTotales.some(prof => {
          const semanas = [];
          for (let i = 0; i < diasDelMes.length; i += 7) {
            let totalSemana = 0;
            for (let j = i; j < Math.min(i + 7, diasDelMes.length); j++) {
              totalSemana += prof.horasPorDia[j];
            }
            semanas.push(totalSemana);
          }
          return semanas.some(semana => semana > maxHoras);
        }) && (
          <div className="px-6 py-2.5 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>Algunos profesionales superan el límite de {maxHoras} horas semanales en ciertas semanas del mes.</span>
          </div>
        )}

        <div className="p-4">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {diasSemana.map((dia, idx) => (
              <div key={idx} className="py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded">
                {dia}
              </div>
            ))}
          </div>

          {/* Grilla del calendario */}
          <div className="grid grid-cols-7 gap-2 bg-gray-100 p-2 rounded-xl">
            {celdas.map((celda, idx) => {
              if (celda.tipo === 'vacio') {
                return (
                  <div key={idx} className="bg-gray-50/50 rounded-lg min-h-[110px] border border-transparent"></div>
                );
              }
              
              const dia = celda.fecha!;
              const nDia = dia.getDate();
              const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;
              const esHoy = new Date().toDateString() === dia.toDateString();
              
              // Feriado
              const feriadoHoy = feriados.find(f => f.mes === dia.getMonth() && f.dia === nDia);
              
              // Calcular horas del día
              let totalDia = 0;
              const profsConHoras: { nombre: string; cargo: string; horas: number }[] = [];
              
              profesionalesFiltrados.forEach(prof => {
                const horas = calcularHorasDiaEspecifico(prof, dia);
                totalDia += horas;
                if (horas > 0) {
                  profsConHoras.push({ nombre: prof.nombre, cargo: prof.cargo, horas });
                }
              });

              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-lg min-h-[110px] p-2 flex flex-col justify-between border transition-all duration-200 hover:shadow-md ${
                    esHoy 
                      ? 'border-indigo-500 ring-2 ring-indigo-100' 
                      : esFinSemana 
                        ? 'border-gray-200 bg-gray-50/50' 
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    {/* Indicador de Feriado */}
                    {feriadoHoy ? (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded max-w-[70%] truncate font-medium" title={feriadoHoy.nombre}>
                        🇨🇱 {feriadoHoy.nombre}
                      </span>
                    ) : (
                      <span></span>
                    )}
                    {/* Número de día */}
                    <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      esHoy 
                        ? 'bg-indigo-600 text-white' 
                        : esFinSemana 
                          ? 'text-red-500' 
                          : 'text-gray-700'
                    }`}>
                      {nDia}
                    </span>
                  </div>

                  {/* Horas del día */}
                  <div className="mt-2 flex-grow flex flex-col justify-end space-y-1">
                    {selectedProfesional === 'todos' ? (
                      // Vista grupal
                      totalDia > 0 ? (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded flex justify-between">
                            <span>Total:</span>
                            <span>{totalDia.toFixed(1)}h</span>
                          </div>
                          {profsConHoras.length > 0 && (
                            <div className="max-h-[45px] overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                              {profsConHoras.map((p, pIdx) => (
                                <div key={pIdx} className="text-[9px] text-gray-500 truncate flex justify-between bg-gray-50 px-1 rounded hover:bg-gray-100">
                                  <span className="font-medium truncate max-w-[70%]" title={p.nombre}>{p.nombre}</span>
                                  <span className="text-green-600 font-semibold">{p.horas}h</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-center text-gray-400 italic">Sin horas</div>
                      )
                    ) : (
                      // Vista individual
                      totalDia > 0 ? (
                        <div className="bg-green-50 text-green-700 border border-green-100 rounded p-1 text-center">
                          <span className="text-xs font-bold block">{totalDia.toFixed(1)} hrs</span>
                          <span className="text-[9px] opacity-75">Laborable</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-center text-gray-400 italic py-1">
                          {feriadoHoy ? 'Feriado' : 'No laborable'}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaActual);
    if (viewType === 'diario') {
      nuevaFecha.setDate(fechaActual.getDate() + dias);
    } else if (viewType === 'semanal') {
      nuevaFecha.setDate(fechaActual.getDate() + (dias * 7));
    } else {
      nuevaFecha.setMonth(fechaActual.getMonth() + dias);
    }
    setFechaActual(nuevaFecha);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('diario')}
            className={`px-4 py-2 rounded-lg font-medium ${viewType === 'diario' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📅 Diario
          </button>
          <button
            onClick={() => setViewType('semanal')}
            className={`px-4 py-2 rounded-lg font-medium ${viewType === 'semanal' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📆 Semanal
          </button>
          <button
            onClick={() => setViewType('mensual')}
            className={`px-4 py-2 rounded-lg font-medium ${viewType === 'mensual' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📊 Mensual
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ◀
          </button>
          <span className="text-sm font-medium text-gray-700">
            {viewType === 'diario' && `${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`}
            {viewType === 'semanal' && `Semana del ${getSemanaActual(fechaActual)[0].getDate()}/${getSemanaActual(fechaActual)[0].getMonth()+1}`}
            {viewType === 'mensual' && `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`}
          </span>
          <button
            onClick={() => cambiarFecha(1)}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ▶
          </button>
          <button
            onClick={() => setFechaActual(new Date())}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm"
          >
            Hoy
          </button>
        </div>
        
        <select
          value={selectedProfesional}
          onChange={(e) => setSelectedProfesional(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todos los profesionales</option>
          {profesionales.filter(p => p.activo).map(prof => (
            <option key={prof.id} value={prof.id}>{prof.nombre}</option>
          ))}
        </select>
      </div>
      
      {viewType === 'diario' && renderVistaDiaria()}
      {viewType === 'semanal' && renderVistaSemanal()}
      {viewType === 'mensual' && renderVistaMensual()}
    </div>
  );
};

const Profesionales: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profesionales' | 'reporte' | 'calendario'>('profesionales');
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudProyecto[]>([]);
  const [horasAsignadas, setHorasAsignadas] = useState<HorasAsignadas>({});
  const [anoSeleccionado, setAnoSeleccionado] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState<Profesional | null>(null);
  const [incluirFeriados, setIncluirFeriados] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fechaCalendario, setFechaCalendario] = useState<Date>(new Date());
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<Profesional | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [profesionalAEliminar, setProfesionalAEliminar] = useState<string | null>(null);
  const [showProyectosModal, setShowProyectosModal] = useState(false);
  const [proyectosModalData, setProyectosModalData] = useState<{ profesionalNombre: string; proyectos: ProyectoAsignado[] }>({ 
    profesionalNombre: '', 
    proyectos: [] 
  });
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cargo: '',
    horasDisponibles: 168,
    horario: {
      lunes: { activo: true, entrada: '09:00', salida: '18:00' },
      martes: { activo: true, entrada: '09:00', salida: '18:00' },
      miercoles: { activo: true, entrada: '09:00', salida: '18:00' },
      jueves: { activo: true, entrada: '09:00', salida: '18:00' },
      viernes: { activo: true, entrada: '09:00', salida: '18:00' },
      sabado: { activo: false, entrada: '09:00', salida: '13:00' },
      domingo: { activo: false, entrada: '09:00', salida: '13:00' }
    }
  });

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const newNotification: Notification = {
      id: Date.now(),
      type,
      message,
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const calcularHorasDia = (entrada: string, salida: string): number => {
    const [horaEntrada, minutoEntrada] = entrada.split(':').map(Number);
    const [horaSalida, minutoSalida] = salida.split(':').map(Number);
    let horas = horaSalida - horaEntrada;
    let minutos = minutoSalida - minutoEntrada;
    if (minutos < 0) {
      horas--;
      minutos += 60;
    }
    return horas + (minutos / 60);
  };

  const calcularHorasSemanales = (horario: any): number => {
    let totalHoras = 0;
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dias.forEach(dia => {
      if (horario[dia].activo) {
        totalHoras += calcularHorasDia(horario[dia].entrada, horario[dia].salida);
      }
    });
    return totalHoras;
  };

  const actualizarHorasDisponibles = (horario: any) => {
    const horasPorSemana = calcularHorasSemanales(horario);
    const horasPorMes = horasPorSemana * 4.33;
    setFormData(prev => ({
      ...prev,
      horasDisponibles: Math.round(horasPorMes)
    }));
  };

  const handleHorarioChange = (dia: string, campo: string, valor: any) => {
    const nuevoHorario = { ...formData.horario };
    if (campo === 'activo') {
      nuevoHorario[dia as keyof typeof nuevoHorario].activo = valor;
    } else {
      nuevoHorario[dia as keyof typeof nuevoHorario][campo as 'entrada' | 'salida'] = valor;
    }
    setFormData({ ...formData, horario: nuevoHorario });
    actualizarHorasDisponibles(nuevoHorario);
  };

  const getDiasLaborablesMes = (ano: number, mes: number, excluirFeriados: boolean = true): Date[] => {
    const diasLaborables: Date[] = [];
    const fecha = new Date(ano, mes, 1);
    const feriados = getFeriadosChile(ano);
    while (fecha.getMonth() === mes) {
      const diaSemana = fecha.getDay();
      const esDiaLaboral = diaSemana >= 1 && diaSemana <= 5;
      if (esDiaLaboral) {
        const esFeriadoHoy = esFeriado(fecha, feriados);
        if (excluirFeriados && !esFeriadoHoy) {
          diasLaborables.push(new Date(fecha));
        } else if (!excluirFeriados) {
          diasLaborables.push(new Date(fecha));
        }
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return diasLaborables;
  };

  const calcularHorasDisponiblesMes = (profesional: Profesional, ano: number, mes: number): number => {
    const diasLaborables = getDiasLaborablesMes(ano, mes, incluirFeriados);
    let totalHoras = 0;
    diasLaborables.forEach(dia => {
      const diaSemana = dia.getDay();
      let diaKey = '';
      switch(diaSemana) {
        case 1: diaKey = 'lunes'; break;
        case 2: diaKey = 'martes'; break;
        case 3: diaKey = 'miercoles'; break;
        case 4: diaKey = 'jueves'; break;
        case 5: diaKey = 'viernes'; break;
        default: return;
      }
      const horarioDia = profesional.horario[diaKey as keyof typeof profesional.horario];
      if (horarioDia && horarioDia.activo) {
        totalHoras += calcularHorasDia(horarioDia.entrada, horarioDia.salida);
      }
    });
    return Math.round(totalHoras * 10) / 10;
  };

  // Cargar solicitudes desde la API
  const cargarSolicitudes = async () => {
    try {
      const response = await api.get('/solicitudes');
      if (response.data.success) {
        const todasSolicitudes = response.data.data || [];
        const disponibles = todasSolicitudes.filter((s: SolicitudProyecto) => 
          s.estado === 'Pendiente' || s.estado === 'En Revision' || s.estado === 'Aprobado'
        );
        setSolicitudes(disponibles);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  };

  // Cargar profesionales desde la API
  const cargarProfesionales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar profesionales
      const profesionalesResponse = await api.get('/profesionales');
      if (profesionalesResponse.data.success) {
        const profesionalesData = profesionalesResponse.data.data || [];
        // Asegurar que los profesionales tengan la estructura de horario
        const profesionalesConHorario = profesionalesData.map((prof: any) => {
          if (!prof.horario) {
            return {
              ...prof,
              horario: {
                lunes: { activo: true, entrada: '09:00', salida: '18:00' },
                martes: { activo: true, entrada: '09:00', salida: '18:00' },
                miercoles: { activo: true, entrada: '09:00', salida: '18:00' },
                jueves: { activo: true, entrada: '09:00', salida: '18:00' },
                viernes: { activo: true, entrada: '09:00', salida: '18:00' },
                sabado: { activo: false, entrada: '09:00', salida: '13:00' },
                domingo: { activo: false, entrada: '09:00', salida: '13:00' }
              }
            };
          }
          return prof;
        });
        setProfesionales(profesionalesConHorario);
      }
      
      // Cargar horas asignadas desde localStorage (para compatibilidad)
      const storedHoras = localStorage.getItem('rpa_horas_asignadas_mensual');
      if (storedHoras) {
        setHorasAsignadas(JSON.parse(storedHoras));
      }
      
      // Cargar solicitudes
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      setError('Error al cargar los profesionales');
      addNotification('error', 'Error al cargar los profesionales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProfesionales();
    
    const handleSolicitudesUpdate = () => {
      cargarSolicitudes();
    };
    
    window.addEventListener('solicitudes-updated', handleSolicitudesUpdate);
    
    return () => {
      window.removeEventListener('solicitudes-updated', handleSolicitudesUpdate);
    };
  }, []);

  const guardarProfesionales = async (nuevaLista: Profesional[]) => {
    // Guardar en localStorage para compatibilidad
    localStorage.setItem('rpa_profesionales', JSON.stringify(nuevaLista));
    setProfesionales(nuevaLista);
  };

  const handleAsignarProyecto = (profesional: Profesional) => {
    cargarSolicitudes();
    setProfesionalSeleccionado(profesional);
    setShowAsignarModal(true);
  };

  const handleVerProyectos = (profesional: Profesional) => {
    setProyectosModalData({
      profesionalNombre: profesional.nombre,
      proyectos: profesional.proyectosAsignados || []
    });
    setShowProyectosModal(true);
  };

  const handleConfirmarAsignacion = async (profesionalId: string, proyectoId: string, estimacionHoras: number, fechaInicio: string, fechaFin: string) => {
    try {
      const response = await api.post('/asignaciones', {
        solicitudId: proyectoId,
        profesionalId: profesionalId,
        estimacionHoras: estimacionHoras,
        fechaInicioEstimada: fechaInicio,
        fechaFinEstimada: fechaFin
      });

      if (response.data.success) {
        addNotification('success', `Proyecto asignado exitosamente`);
        // Recargar datos
        await cargarProfesionales();
        await cargarSolicitudes();
        setShowAsignarModal(false);
        window.dispatchEvent(new Event('solicitudes-updated'));
      } else {
        addNotification('error', response.data.message || 'Error al asignar proyecto');
      }
    } catch (error: any) {
      console.error('Error asignando proyecto:', error);
      addNotification('error', error.response?.data?.message || 'Error al asignar proyecto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      addNotification('error', 'El nombre es obligatorio');
      return;
    }
    if (!formData.email.trim()) {
      addNotification('error', 'El email es obligatorio');
      return;
    }
    if (!formData.email.includes('@')) {
      addNotification('error', 'El email no es válido');
      return;
    }
    if (!formData.cargo.trim()) {
      addNotification('error', 'El cargo es obligatorio');
      return;
    }

    const horasSemanales = calcularHorasSemanales(formData.horario);
    const maxHoras = getMaxHorasSemanales(new Date());
    const excedeLimite = horasSemanales > maxHoras;
    
    try {
      if (editingProfesional) {
        const response = await api.put(`/profesionales/${editingProfesional.id}`, {
          nombre: formData.nombre,
          email: formData.email,
          cargo: formData.cargo,
          horasDisponibles: formData.horasDisponibles,
          horario: formData.horario
        });
        
        if (response.data.success) {
          await cargarProfesionales();
          if (excedeLimite) {
            addNotification('warning', `Profesional actualizado pero excede las ${maxHoras} horas semanales permitidas por ley`);
          } else {
            addNotification('success', 'Profesional actualizado exitosamente');
          }
        }
      } else {
        const response = await api.post('/profesionales', {
          nombre: formData.nombre,
          email: formData.email,
          cargo: formData.cargo,
          horasDisponibles: formData.horasDisponibles,
          horario: formData.horario
        });
        
        if (response.data.success) {
          await cargarProfesionales();
          if (excedeLimite) {
            addNotification('warning', `Profesional agregado pero excede las ${maxHoras} horas semanales permitidas por ley`);
          } else {
            addNotification('success', 'Profesional agregado exitosamente');
          }
        }
      }
    } catch (error: any) {
      console.error('Error guardando profesional:', error);
      addNotification('error', error.response?.data?.message || 'Error al guardar profesional');
    }

    setFormData({
      nombre: '',
      email: '',
      cargo: '',
      horasDisponibles: 168,
      horario: {
        lunes: { activo: true, entrada: '09:00', salida: '18:00' },
        martes: { activo: true, entrada: '09:00', salida: '18:00' },
        miercoles: { activo: true, entrada: '09:00', salida: '18:00' },
        jueves: { activo: true, entrada: '09:00', salida: '18:00' },
        viernes: { activo: true, entrada: '09:00', salida: '18:00' },
        sabado: { activo: false, entrada: '09:00', salida: '13:00' },
        domingo: { activo: false, entrada: '09:00', salida: '13:00' }
      }
    });
    setEditingProfesional(null);
    setShowModal(false);
  };

  const handleEdit = (profesional: Profesional) => {
    setEditingProfesional(profesional);
    setFormData({
      nombre: profesional.nombre,
      email: profesional.email,
      cargo: profesional.cargo,
      horasDisponibles: profesional.horasDisponibles,
      horario: profesional.horario
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, nombre: string) => {
    setProfesionalAEliminar(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (profesionalAEliminar) {
      try {
        const response = await api.delete(`/profesionales/${profesionalAEliminar}`);
        if (response.data.success) {
          await cargarProfesionales();
          addNotification('success', 'Profesional eliminado exitosamente');
        }
      } catch (error: any) {
        console.error('Error eliminando profesional:', error);
        addNotification('error', error.response?.data?.message || 'Error al eliminar profesional');
      }
      setProfesionalAEliminar(null);
    }
  };

  const handleToggleActivo = async (id: string) => {
    try {
      // Buscar el profesional para obtener su estado actual
      const profesional = profesionales.find(p => p.id === id);
      if (profesional) {
        const response = await api.put(`/profesionales/${id}`, {
          ...profesional,
          activo: !profesional.activo
        });
        if (response.data.success) {
          await cargarProfesionales();
          addNotification('success', response.data.data?.activo ? 'Profesional activado' : 'Profesional desactivado');
        }
      }
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      addNotification('error', error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const calcularHorasPorMes = () => {
    const profesionalesActivos = profesionales.filter(p => p.activo);
    const resultados: any[] = [];
    
    profesionalesActivos.forEach(prof => {
      const fila: any = {
        profesional: prof.nombre,
        cargo: prof.cargo,
        id: prof.id
      };
      
      meses.forEach((mes, index) => {
        const horas = calcularHorasDisponiblesMes(prof, anoSeleccionado, index);
        fila[mes] = horas;
        
        const keyMes = `${anoSeleccionado}-${index}`;
        if (horasAsignadas[prof.id] && horasAsignadas[prof.id][keyMes]) {
          fila[`${mes}_asignadas`] = horasAsignadas[prof.id][keyMes];
        } else {
          fila[`${mes}_asignadas`] = 0;
        }
      });
      
      let totalAnual = 0;
      meses.forEach((_, index) => {
        totalAnual += calcularHorasDisponiblesMes(prof, anoSeleccionado, index);
      });
      fila.totalAnual = totalAnual;
      
      resultados.push(fila);
    });
    
    return resultados;
  };

  const exportToExcel = () => {
    const datos = calcularHorasPorMes();
    const maxHoras = getMaxHorasSemanales(new Date(anoSeleccionado, 0, 1));
    const leyTexto = getLeyHorasTexto(new Date(anoSeleccionado, 0, 1));
    
    const exportData: (string | number)[][] = [
      ['REPORTE DE HORAS MENSUALES', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`AÑO: ${anoSeleccionado}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [`Ley vigente: ${leyTexto}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [`Cálculo con feriados: ${incluirFeriados ? 'EXCLUYENDO feriados (no se trabajan)' : 'INCLUYENDO feriados (se trabajan)'}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [''],
      ['PROFESIONAL', 'CARGO', ...meses, 'TOTAL ANUAL']
    ];
    
    datos.forEach(row => {
      const fila: (string | number)[] = [
        row.profesional,
        row.cargo,
        ...meses.map(mes => row[mes]),
        row.totalAnual
      ];
      exportData.push(fila);
    });
    
    const totalesPorMes = meses.map((_, index) => {
      let total = 0;
      datos.forEach(row => {
        total += row[meses[index]];
      });
      return total;
    });
    
    exportData.push(['']);
    exportData.push(['TOTALES', '', ...totalesPorMes.map(t => t), '']);
    
    const feriados = getFeriadosChile(anoSeleccionado);
    exportData.push(['']);
    exportData.push(['FERIADOS LEGALES DE CHILE', '', '', '', '', '', '', '', '', '', '', '', '']);
    feriados.forEach(feriado => {
      const nombreMes = meses[feriado.mes];
      exportData.push([`${feriado.dia} de ${nombreMes}`, feriado.nombre, '', '', '', '', '', '', '', '', '', '', '']);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, `Horas_${anoSeleccionado}`);
    XLSX.writeFile(wb, `Reporte_Horas_${anoSeleccionado}.xlsx`);
    
    addNotification('success', 'Reporte exportado exitosamente');
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
            onClick={cargarProfesionales}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const datosReporte = calcularHorasPorMes();
  const totalesPorMes = meses.map((_, index) => {
    let total = 0;
    datosReporte.forEach(row => {
      total += row[meses[index]];
    });
    return total;
  });

  const feriadosAno = getFeriadosChile(anoSeleccionado);
  const maxHorasActual = getMaxHorasSemanales(new Date(anoSeleccionado, 0, 1));
  const leyTextoActual = getLeyHorasTexto(new Date(anoSeleccionado, 0, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Profesional"
        message="¿Estás seguro de que deseas eliminar este profesional? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-indigo-600 mr-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Gestión de Profesionales</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cargarProfesionales}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center px-2 sm:px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
              {activeTab === 'profesionales' && (
                <button
                  onClick={() => {
                    setEditingProfesional(null);
                    setFormData({
                      nombre: '',
                      email: '',
                      cargo: '',
                      horasDisponibles: 168,
                      horario: {
                        lunes: { activo: true, entrada: '09:00', salida: '18:00' },
                        martes: { activo: true, entrada: '09:00', salida: '18:00' },
                        miercoles: { activo: true, entrada: '09:00', salida: '18:00' },
                        jueves: { activo: true, entrada: '09:00', salida: '18:00' },
                        viernes: { activo: true, entrada: '09:00', salida: '18:00' },
                        sabado: { activo: false, entrada: '09:00', salida: '13:00' },
                        domingo: { activo: false, entrada: '09:00', salida: '13:00' }
                      }
                    });
                    setShowModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Profesional
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-xs text-yellow-800 text-center">
            📋 <strong>Ley 40 horas en Chile:</strong> A partir del 26 de abril 2024: 44 horas | 
            26 de abril 2026: 42 horas | 26 de abril 2028: 40 horas
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profesionales')}
              className={`${
                activeTab === 'profesionales'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Profesionales
            </button>
            <button
              onClick={() => setActiveTab('reporte')}
              className={`${
                activeTab === 'reporte'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reporte de Horas
            </button>
            <button
              onClick={() => setActiveTab('calendario')}
              className={`${
                activeTab === 'calendario'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'profesionales' && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas/Mes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignación Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyectos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profesionales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                          No hay profesionales registrados. Haz clic en "Nuevo Profesional" para agregar.
                        </td>
                      </tr>
                    ) : (
                      profesionales.map(prof => {
                        const horasSemanales = calcularHorasSemanales(prof.horario);
                        const maxHoras = getMaxHorasSemanales(new Date());
                        const excedeLimite = horasSemanales > maxHoras;
                        const fechaActual = new Date();
                        const mesActual = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}`;
                        const horasAsignadasMes = prof.horasAsignadasMes?.[mesActual] || 0;
                        const horasDisponiblesRestantes = prof.horasDisponibles - horasAsignadasMes;
                        const porcentajeOcupacion = (horasAsignadasMes / prof.horasDisponibles) * 100;
                        
                        return (
                          <tr key={prof.id} className={`hover:bg-gray-50 ${!prof.activo ? 'bg-gray-100' : ''} ${excedeLimite ? 'border-l-4 border-yellow-500' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-indigo-600 font-semibold text-sm">
                                    {prof.nombre.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className={`font-medium ${!prof.activo ? 'text-gray-400' : 'text-gray-900'}`}>
                                  {prof.nombre}
                                </span>
                                {excedeLimite && (
                                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                    ⚠️ Excede {maxHoras}h
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${!prof.activo ? 'text-gray-400' : 'text-gray-600'}`}>
                              {prof.email}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${!prof.activo ? 'text-gray-400' : 'text-gray-600'}`}>
                              {prof.cargo}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs">
                                <span className={`font-semibold ${excedeLimite ? 'text-red-600' : 'text-green-600'}`}>
                                  {horasSemanales.toFixed(1)} hrs/semana
                                </span>
                                <div className="text-gray-500 mt-1">
                                  {prof.horario.lunes.activo && 'L '}
                                  {prof.horario.martes.activo && 'M '}
                                  {prof.horario.miercoles.activo && 'M '}
                                  {prof.horario.jueves.activo && 'J '}
                                  {prof.horario.viernes.activo && 'V '}
                                  {prof.horario.sabado.activo && 'S '}
                                  {prof.horario.domingo.activo && 'D'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <span className={`font-semibold ${!prof.activo ? 'text-gray-400' : 'text-green-600'}`}>
                                  {prof.horasDisponibles} hrs
                                </span>
                                <div className="text-xs text-gray-500">
                                  <span className={porcentajeOcupacion > 90 ? 'text-red-600' : porcentajeOcupacion > 70 ? 'text-yellow-600' : 'text-blue-600'}>
                                    Asignadas: {horasAsignadasMes} hrs ({porcentajeOcupacion.toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${porcentajeOcupacion > 90 ? 'bg-red-600' : porcentajeOcupacion > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Disponible: {horasDisponiblesRestantes} hrs
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs">
                                {prof.proyectosAsignados && prof.proyectosAsignados.length > 0 ? (
                                  <div>
                                    <span className="font-semibold text-purple-600">{prof.proyectosAsignados.length} proyectos</span>
                                    <div className="text-gray-400 mt-1 max-w-xs truncate">
                                      {prof.proyectosAsignados.slice(0, 2).map(p => p.nombreProyecto).join(', ')}
                                      {prof.proyectosAsignados.length > 2 && '...'}
                                    </div>
                                    <button 
                                      onClick={() => handleVerProyectos(prof)}
                                      className="text-xs text-blue-500 hover:text-blue-700 mt-1 font-medium"
                                    >
                                      Ver todos ({prof.proyectosAsignados.length})
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Sin proyectos</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActivo(prof.id)}
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  prof.activo 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {prof.activo ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleEdit(prof)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleAsignarProyecto(prof)}
                                className="text-purple-600 hover:text-purple-900 mr-3"
                              >
                                Asignar
                              </button>
                              <button
                                onClick={() => handleDeleteClick(prof.id, prof.nombre)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {profesionales.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Profesionales</h3>
                  <p className="text-2xl font-bold text-gray-900">{profesionales.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500">Profesionales Activos</h3>
                  <p className="text-2xl font-bold text-green-600">{profesionales.filter(p => p.activo).length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Horas Disponibles</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {profesionales.filter(p => p.activo).reduce((sum, p) => sum + p.horasDisponibles, 0)} hrs
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500">Proyectos Disponibles</h3>
                  <p className="text-2xl font-bold text-orange-600">{solicitudes.length}</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'reporte' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                📋 <strong>Ley vigente para {anoSeleccionado}:</strong> {leyTextoActual} (máximo {maxHorasActual} horas semanales)
              </p>
            </div>

            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <div className="flex gap-3 items-center flex-wrap">
                <select
                  value={anoSeleccionado}
                  onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2023}>2023 (45 horas)</option>
                  <option value={2024}>2024 (44 horas - desde 26 abril)</option>
                  <option value={2025}>2025 (44 horas)</option>
                  <option value={2026}>2026 (42 horas - desde 26 abril)</option>
                  <option value={2027}>2027 (42 horas)</option>
                  <option value={2028}>2028 (40 horas - desde 26 abril)</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={incluirFeriados}
                    onChange={(e) => setIncluirFeriados(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Excluir feriados (no se trabajan)</span>
                </label>
              </div>
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar a Excel
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-gradient-to-r from-indigo-600 to-purple-600">
                        Profesional
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Cargo
                      </th>
                      {meses.map(mes => (
                        <th key={mes} className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                          {mes.substring(0, 3)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        Total Anual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosReporte.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="px-6 py-8 text-center text-gray-400">
                          No hay profesionales activos para mostrar el reporte
                        </td>
                      </tr>
                    ) : (
                      datosReporte.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                            {row.profesional}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {row.cargo}
                          </td>
                          {meses.map(mes => (
                            <td key={mes} className="px-3 py-3 whitespace-nowrap text-sm text-center">
                              <div>
                                <span className="font-semibold text-gray-900">{row[mes]} hrs</span>
                                {row[`${mes}_asignadas`] > 0 && (
                                  <div className="text-xs text-blue-600">
                                    Asig: {row[`${mes}_asignadas`]} hrs
                                  </div>
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                            {row.totalAnual} hrs
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {datosReporte.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-700">
                          TOTALES
                        </td>
                        {totalesPorMes.map((total, idx) => (
                          <td key={idx} className="px-3 py-3 text-sm text-center font-bold text-indigo-600">
                            {total} hrs
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-center font-bold text-indigo-600">
                          {totalesPorMes.reduce((a, b) => a + b, 0)} hrs
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📊 Información del cálculo:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✓ Las horas se calculan según el horario configurado para cada profesional</li>
                  <li>✓ Solo se consideran días laborales (lunes a viernes)</li>
                  <li>✓ <strong>{leyTextoActual}</strong></li>
                  <li>✓ Total mensual = suma de horas de todos los días laborables del mes</li>
                  <li>✓ El horario por defecto es de 9:00 a 18:00 (8 horas diarias)</li>
                  <li>✓ {incluirFeriados ? '❌ Los feriados NO se consideran días trabajados' : '✓ Los feriados SÍ se consideran días trabajados'}</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">📅 Feriados Legales de Chile - {anoSeleccionado}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-yellow-700 max-h-40 overflow-y-auto">
                  {feriadosAno.map((feriado, idx) => (
                    <div key={idx}>
                      • {feriado.dia} de {meses[feriado.mes].toLowerCase()}: {feriado.nombre}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'calendario' && (
          <CalendarView 
            profesionales={profesionales} 
            fechaActual={fechaCalendario}
            setFechaActual={setFechaCalendario}
          />
        )}

        <ModalAsignarProyecto
          isOpen={showAsignarModal}
          onClose={() => setShowAsignarModal(false)}
          profesional={profesionalSeleccionado}
          proyectosDisponibles={solicitudes}
          onAsignar={handleConfirmarAsignacion}
        />

        {/* Modal de proyectos del profesional */}
        {showProyectosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
                <h3 className="text-xl font-bold text-white">
                  📋 Proyectos de {proyectosModalData.profesionalNombre}
                </h3>
                <button 
                  onClick={() => setShowProyectosModal(false)} 
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {proyectosModalData.proyectos.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No hay proyectos asignados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proyectosModalData.proyectos.map((proyecto, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{proyecto.nombreProyecto}</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Solicitante:</span>
                                <p className="text-gray-800">{proyecto.nombreSolicitante}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Área:</span>
                                <p className="text-gray-800">{proyecto.area}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Horas asignadas:</span>
                                <p className="text-purple-600 font-semibold">{proyecto.estimacionHoras} hrs</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha asignación:</span>
                                <p className="text-gray-800">{proyecto.fechaAsignacion}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha inicio:</span>
                                <p className="text-gray-800">{proyecto.fechaInicioEstimada || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha fin:</span>
                                <p className="text-gray-800">{proyecto.fechaFinEstimada || '-'}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              proyecto.estado === 'Asignado' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {proyecto.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowProyectosModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
              <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingProfesional ? 'Editar Profesional' : 'Nuevo Profesional'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Información Personal</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        disabled={!!editingProfesional}
                      />
                      {editingProfesional && (
                        <p className="text-xs text-gray-400 mt-1">El email no se puede modificar</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo *
                      </label>
                      <input
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        placeholder="Ej: Desarrollador RPA, Analista, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horas disponibles por mes
                      </label>
                      <input
                        type="number"
                        value={formData.horasDisponibles}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Calculado automáticamente según el horario configurado
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Configuración de Horario</h3>
                    <div className="bg-blue-50 p-3 rounded-lg mb-3 text-xs text-blue-700">
                      ⚠️ <strong>{getLeyHorasTexto(new Date())}</strong><br />
                      Puedes configurar el horario que desees. Si excedes el límite legal, se mostrará una advertencia.
                    </div>
                    <div className="space-y-3">
                      {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                        <div key={dia} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-medium text-gray-700 capitalize">{dia}</label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.horario[dia as keyof typeof formData.horario].activo}
                                onChange={(e) => handleHorarioChange(dia, 'activo', e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                              />
                              <span className="text-sm text-gray-600">Activo</span>
                            </label>
                          </div>
                          {formData.horario[dia as keyof typeof formData.horario].activo && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Entrada</label>
                                <input
                                  type="time"
                                  value={formData.horario[dia as keyof typeof formData.horario].entrada}
                                  onChange={(e) => handleHorarioChange(dia, 'entrada', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Salida</label>
                                <input
                                  type="time"
                                  value={formData.horario[dia as keyof typeof formData.horario].salida}
                                  onChange={(e) => handleHorarioChange(dia, 'salida', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <strong>Total horas semanales configuradas:</strong> {calcularHorasSemanales(formData.horario).toFixed(1)} horas
                        {calcularHorasSemanales(formData.horario) > getMaxHorasSemanales(new Date()) && (
                          <span className="block text-red-600 mt-1">
                            ⚠️ Atención: Estás configurando {calcularHorasSemanales(formData.horario).toFixed(1)} horas semanales, 
                            lo cual excede el máximo legal de {getMaxHorasSemanales(new Date())} horas.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 sticky bottom-0 bg-white pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProfesional(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingProfesional ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Profesionales;