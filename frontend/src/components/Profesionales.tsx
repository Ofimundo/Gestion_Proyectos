// src/components/Profesionales.tsx
import React, { useState, useEffect } from 'react';
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
  horario: {
    lunes: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    martes: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    miercoles: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    jueves: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    viernes: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    sabado: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
    domingo: { activo: boolean; entrada: string; salida: string; colacionMinutos?: number };
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

const calcularHorasDia = (entrada: string, salida: string): number => {
  if (!entrada || !salida) return 0;
  const [horaEntrada, minutoEntrada] = entrada.split(':').map(Number);
  const [horaSalida, minutoSalida] = salida.split(':').map(Number);
  if (isNaN(horaEntrada) || isNaN(minutoEntrada) || isNaN(horaSalida) || isNaN(minutoSalida)) return 0;
  let horas = horaSalida - horaEntrada;
  let minutos = minutoSalida - minutoEntrada;
  if (minutos < 0) {
    horas--;
    minutos += 60;
  }
  return Math.max(0, horas + (minutos / 60));
};

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

interface AjusteHoraMes {
  profesionalId: string;
  profesionalNombre?: string;
  ano: number;
  mes: number; // 0..11
  tipo: 'restar' | 'sumar' | 'fijar';
  cantidad: number;
  diasSeleccionados?: number[];
  horasPorDia?: number;
  motivo: string;
  fechaActualizacion?: string;
}

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

const CalendarView: React.FC<{ 
  profesionales: Profesional[]; 
  fechaActual: Date; 
  setFechaActual: (date: Date) => void;
  ajustesHoras: AjusteHoraMes[];
  setAjustesHoras: React.Dispatch<React.SetStateAction<AjusteHoraMes[]>>;
}> = ({ 
  profesionales, 
  fechaActual, 
  setFechaActual,
  ajustesHoras,
  setAjustesHoras
}) => {
  const [viewType, setViewType] = useState<'anual' | 'mensual' | 'semanal' | 'diario'>('anual');
  const [selectedProfesional, setSelectedProfesional] = useState<string>('todos');

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
      return calcularHorasDia(horarioDia.entrada, horarioDia.salida);
    }
    return 0;
  };

  const profesionalesFiltrados = selectedProfesional === 'todos' 
    ? profesionales.filter(p => p.activo)
    : profesionales.filter(p => p.id === selectedProfesional && p.activo);

  const renderVistaDiaria = () => {
    const mesIdx = fechaActual.getMonth();
    const ano = fechaActual.getFullYear();

    const horasPorProfesional = profesionalesFiltrados.map(prof => {
      const horasDia = calcularHorasDiaEspecifico(prof, fechaActual);
      const infoMes = getHorasMesProf(prof, ano, mesIdx);
      return {
        prof,
        nombre: prof.nombre,
        cargo: prof.cargo,
        horasDia,
        infoMes
      };
    });

    const totalHorasDia = horasPorProfesional.reduce((sum, p) => sum + p.horasDia, 0);
    const feriados = getFeriadosChile(ano);
    const esFeriadoHoy = esFeriado(fechaActual, feriados);
    const feriadoNombre = feriados.find(f => f.mes === mesIdx && f.dia === fechaActual.getDate())?.nombre;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-6">
        <div className="text-center pb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {fechaActual.getDate()} de {meses[mesIdx]} de {ano}
          </h3>
          {esFeriadoHoy && (
            <div className="mt-2 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              🗓️ Feriado Chile: {feriadoNombre}
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Colaborador</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cargo</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Horas del Día</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Estado Mensual / Ajuste</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {horasPorProfesional.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 flex items-center gap-2">
                    <span>{item.nombre}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">{item.cargo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`font-semibold ${item.horasDia > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.horasDia > 0 ? `${item.horasDia} hrs` : 'No laborable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.infoMes.ajuste ? (
                      <div className={`inline-flex flex-col text-[11px] p-1.5 rounded border text-left font-medium ${
                        item.infoMes.cambioDiferencia < 0 
                          ? 'bg-red-50 border-red-200 text-red-700' 
                          : 'bg-green-50 border-green-200 text-green-700'
                      }`}>
                        <span>
                          {item.infoMes.cambioDiferencia < 0 ? `🔻 Restadas ${Math.abs(item.infoMes.cambioDiferencia)}h` : `🔺 Sumadas ${item.infoMes.cambioDiferencia}h`}
                        </span>
                        <span className="text-[10px] italic truncate max-w-[180px]">💬 "{item.infoMes.ajuste.motivo}"</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Total mes: {item.infoMes.horasFinales}h
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleAbrirModalEdit(item.prof, mesIdx)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all border border-indigo-200"
                    >
                      ✏️ Editar Horas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-sm text-gray-700">Total del día</td>
                <td className="px-6 py-3 text-center text-sm text-indigo-600">{totalHorasDia.toFixed(1)} hrs</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderVistaSemanal = () => {
    const semana = getSemanaActual(fechaActual);
    const mesIdx = semana[0].getMonth();
    const ano = semana[0].getFullYear();
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto space-y-4">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Semana del {semana[0].getDate()} de {meses[semana[0].getMonth()]} al {semana[6].getDate()} de {meses[semana[6].getMonth()]}
          </h3>
          <span className="text-xs text-gray-500">💡 Haz clic en ✏️ para editar u ofrecer comentarios por colaborador</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium uppercase">Colaborador</th>
              {semana.map((dia, idx) => (
                <th key={idx} className="px-3 py-3 text-center font-medium uppercase">
                  {diasSemana[idx]}<br />
                  <span className="text-xs opacity-90">{dia.getDate()}/{dia.getMonth()+1}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-medium uppercase">Total Semana</th>
              <th className="px-3 py-3 text-center font-medium uppercase">Editar</th>
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
              
              const infoMes = getHorasMesProf(prof, ano, mesIdx);
              const maxHoras = getMaxHorasSemanales(fechaActual);
              const excedeLimite = totalSemana > maxHoras;
              
              return (
                <tr key={prof.id} className={`hover:bg-gray-50 ${excedeLimite ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{prof.nombre}</span>
                      {infoMes.ajuste && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 w-fit ${
                          infoMes.cambioDiferencia < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {infoMes.cambioDiferencia < 0 ? `🔻 -${Math.abs(infoMes.cambioDiferencia)}h (${infoMes.ajuste.motivo})` : `🔺 +${infoMes.cambioDiferencia}h (${infoMes.ajuste.motivo})`}
                        </span>
                      )}
                      {excedeLimite && (
                        <div className="text-[10px] text-red-500 font-bold">⚠️ Excede {maxHoras}h</div>
                      )}
                    </div>
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
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleAbrirModalEdit(prof, mesIdx)}
                      className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all border border-indigo-200"
                      title="Editar horas / comentario del colaborador"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td className="px-4 py-3 text-sm text-gray-700">Total por día</td>
              {semana.map((_, idx) => {
                let totalDia = 0;
                profesionalesFiltrados.forEach(prof => {
                  totalDia += calcularHorasDiaEspecifico(prof, semana[idx]);
                });
                return (
                  <td key={idx} className="px-3 py-3 text-sm text-center text-indigo-600">
                    {totalDia.toFixed(1)} hrs
                  </td>
                );
              })}
              <td className="px-3 py-3 text-sm text-center text-indigo-600">
                {profesionalesFiltrados.reduce((sum, prof) => {
                  let total = 0;
                  semana.forEach(dia => {
                    total += calcularHorasDiaEspecifico(prof, dia);
                  });
                  return sum + total;
                }, 0).toFixed(1)} hrs
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderVistaMensual = () => {
    const mesIdx = fechaActual.getMonth();
    const ano = fechaActual.getFullYear();
    const diasDelMes = getDiasDelMes(ano, mesIdx);
    const maxHoras = getMaxHorasSemanales(fechaActual);
    
    // Obtener feriados
    const feriados = getFeriadosChile(ano);
    
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
    
    // Calcular el total mensual general de horas y totales por profesional aplicando ajustes
    const profesionalesConTotales = profesionalesFiltrados.map(prof => {
      const infoMes = getHorasMesProf(prof, ano, mesIdx);
      const horasPorDia = diasDelMes.map(dia => calcularHorasDiaEspecifico(prof, dia));
      return { 
        prof, 
        nombre: prof.nombre,
        cargo: prof.cargo,
        totalMes: infoMes.horasFinales, 
        horasPorDia,
        infoMes
      };
    });

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden space-y-6">
        {/* Header Mensual */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 capitalize">
              {meses[mesIdx]} {ano}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Capacidad y gestión de horas mensuales por colaborador
            </p>
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
          <div className="mx-6 py-2.5 px-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>Algunos profesionales superan el límite de {maxHoras} horas semanales en ciertas semanas del mes.</span>
          </div>
        )}

        <div className="p-6">
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
              const profsConHoras: { prof: Profesional; nombre: string; cargo: string; horasDia: number; horasMensuales: number; ajuste: any; cambioDiferencia: number }[] = [];
              
              profesionalesFiltrados.forEach(prof => {
                const infoM = getHorasMesProf(prof, ano, mesIdx);
                const horas = calcularHorasDiaEspecifico(prof, dia);
                totalDia += horas;
                if (horas > 0) {
                  profsConHoras.push({ 
                    prof,
                    nombre: prof.nombre, 
                    cargo: prof.cargo, 
                    horasDia: horas,
                    horasMensuales: infoM.horasFinales,
                    ajuste: infoM.ajuste,
                    cambioDiferencia: infoM.cambioDiferencia
                  });
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

                  {/* Horas del día / horas mensuales de colaboradores con icono de editar al lado del nombre */}
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
                            <div className="max-h-[50px] overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                              {profsConHoras.map((p, pIdx) => (
                                <div 
                                  key={pIdx} 
                                  onClick={() => handleAbrirModalEdit(p.prof, mesIdx)}
                                  className="text-[9px] text-gray-700 truncate flex justify-between items-center bg-gray-50 px-1 py-0.5 rounded hover:bg-indigo-50 cursor-pointer group transition-colors"
                                  title={`Click para editar horas / motivo de ${p.nombre}`}
                                >
                                  <div className="flex items-center gap-1 truncate max-w-[65%]">
                                    <span className="font-medium truncate">{p.nombre}</span>
                                    <span className="text-amber-500 text-[10px] group-hover:scale-125 transition-transform shrink-0">✏️</span>
                                  </div>
                                  <span className={`font-bold ${p.ajuste ? (p.cambioDiferencia < 0 ? 'text-red-600' : 'text-green-600') : 'text-indigo-600'}`}>
                                    {p.horasMensuales.toFixed(0)}h
                                    {p.ajuste && (p.cambioDiferencia < 0 ? '🔻' : '🔺')}
                                  </span>
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

  const [modalEditState, setModalEditState] = useState<{
    open: boolean;
    profesional?: Profesional;
    mesIndex?: number;
    ano?: number;
  }>({ open: false });

  const [editTipo, setEditTipo] = useState<'restar' | 'sumar'>('restar');
  const [editCantidad, setEditCantidad] = useState<number | ''>('');
  const [editDiasSeleccionados, setEditDiasSeleccionados] = useState<number[]>([]);
  const [editHorasPorDia, setEditHorasPorDia] = useState<number>(8);
  const [editMotivo, setEditMotivo] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  const getHorasMesProf = (profesional: Profesional, ano: number, mesIndex: number) => {
    const diasDelMes = getDiasDelMes(ano, mesIndex);
    let horasBase = 0;
    diasDelMes.forEach(dia => {
      horasBase += calcularHorasDiaEspecifico(profesional, dia);
    });

    const ajuste = ajustesHoras.find(
      a => a.profesionalId === profesional.id && a.ano === ano && a.mes === mesIndex
    );

    let horasFinales = horasBase;
    let cambioDiferencia = 0;

    if (ajuste) {
      if (ajuste.tipo === 'restar') {
        cambioDiferencia = -Math.abs(ajuste.cantidad);
        horasFinales = Math.max(0, horasBase - Math.abs(ajuste.cantidad));
      } else if (ajuste.tipo === 'sumar') {
        cambioDiferencia = Math.abs(ajuste.cantidad);
        horasFinales = horasBase + Math.abs(ajuste.cantidad);
      } else if (ajuste.tipo === 'fijar') {
        horasFinales = Math.max(0, ajuste.cantidad);
        cambioDiferencia = horasFinales - horasBase;
      }
    }

    return {
      horasBase,
      horasFinales,
      cambioDiferencia,
      ajuste
    };
  };

  const handleAbrirModalEdit = (profesional: Profesional, mesIndex: number) => {
    const ano = fechaActual.getFullYear();
    const info = getHorasMesProf(profesional, ano, mesIndex);
    setModalEditState({ open: true, profesional, mesIndex, ano });
    if (info.ajuste) {
      setEditTipo(info.ajuste.tipo === 'sumar' ? 'sumar' : 'restar');
      setEditCantidad(info.ajuste.cantidad);
      setEditDiasSeleccionados(info.ajuste.diasSeleccionados || []);
      setEditHorasPorDia(info.ajuste.horasPorDia || 8);
      setEditMotivo(info.ajuste.motivo || '');
    } else {
      setEditTipo('restar');
      setEditCantidad('');
      setEditDiasSeleccionados([]);
      setEditHorasPorDia(8);
      setEditMotivo('');
    }
    setEditError(null);
  };

  const handleToggleDiaModal = (diaNum: number) => {
    setEditDiasSeleccionados(prev => {
      let nuevos: number[];
      if (prev.includes(diaNum)) {
        nuevos = prev.filter(d => d !== diaNum);
      } else {
        nuevos = [...prev, diaNum].sort((a, b) => a - b);
      }
      if (nuevos.length > 0) {
        setEditCantidad(nuevos.length * editHorasPorDia);
      } else {
        setEditCantidad('');
      }
      return nuevos;
    });
  };

  const handleGuardarAjuste = () => {
    if (!modalEditState.profesional || modalEditState.mesIndex === undefined || !modalEditState.ano) return;
    
    const cantidadNumerica = Number(editCantidad) || 0;
    if (cantidadNumerica <= 0) {
      setEditError('La cantidad de horas debe ser mayor a 0 (selecciona días en el calendario o ingresa las horas)');
      return;
    }

    if (!editMotivo.trim()) {
      setEditError('Debes ingresar un comentario o motivo explicando el ajuste');
      return;
    }

    const nuevoAjuste: AjusteHoraMes = {
      profesionalId: modalEditState.profesional.id,
      profesionalNombre: modalEditState.profesional.nombre,
      ano: modalEditState.ano,
      mes: modalEditState.mesIndex,
      tipo: editTipo,
      cantidad: cantidadNumerica,
      diasSeleccionados: editDiasSeleccionados,
      horasPorDia: editHorasPorDia,
      motivo: editMotivo.trim(),
      fechaActualizacion: new Date().toISOString()
    };

    const actualizados = [
      ...ajustesHoras.filter(
        a => !(a.profesionalId === nuevoAjuste.profesionalId && a.ano === nuevoAjuste.ano && a.mes === nuevoAjuste.mes)
      ),
      nuevoAjuste
    ];

    setAjustesHoras(actualizados);
    localStorage.setItem('rpa_ajustes_horas_colaboradores', JSON.stringify(actualizados));
    setModalEditState({ open: false });
  };

  const handleEliminarAjuste = () => {
    if (!modalEditState.profesional || modalEditState.mesIndex === undefined || !modalEditState.ano) return;
    const actualizados = ajustesHoras.filter(
      a => !(a.profesionalId === modalEditState.profesional!.id && a.ano === modalEditState.ano && a.mes === modalEditState.mesIndex)
    );
    setAjustesHoras(actualizados);
    localStorage.setItem('rpa_ajustes_horas_colaboradores', JSON.stringify(actualizados));
    setModalEditState({ open: false });
  };

  const renderVistaAnual = () => {
    const anoActual = fechaActual.getFullYear();
    const feriados = getFeriadosChile(anoActual);
    
    // Totales por mes para la vista anual
    const resumenMeses = meses.map((nombreMes, mesIndex) => {
      const diasDelMes = getDiasDelMes(anoActual, mesIndex);
      const feriadosMes = feriados.filter(f => f.mes === mesIndex);
      
      let totalHorasMes = 0;
      const datosColaboradores = profesionalesFiltrados.map(prof => {
        const info = getHorasMesProf(prof, anoActual, mesIndex);
        totalHorasMes += info.horasFinales;
        return {
          profesional: prof,
          ...info
        };
      });

      return {
        nombreMes,
        mesIndex,
        diasDelMesCount: diasDelMes.length,
        totalHorasMes,
        feriadosMes,
        datosColaboradores
      };
    });

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden space-y-6 p-6">
        {/* Header Anual */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white flex flex-wrap justify-between items-center gap-4 shadow-sm">
          <div>
            <h3 className="text-xl font-bold">
              Resumen Anual {anoActual}
            </h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              Capacidad y gestión de horas mensuales por colaborador (Edición y ajustes de horas)
            </p>
          </div>
        </div>

        {/* Grid de 12 Meses con mini calendario de días y colaboradores detallados */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Meses del Año {anoActual} (Días del Mes & Colaboradores)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {resumenMeses.map((m) => {
              const esHoyMes = new Date().getFullYear() === anoActual && new Date().getMonth() === m.mesIndex;
              
              // Calcular celdas del mini-calendario de días para este mes
              const diasMes = getDiasDelMes(anoActual, m.mesIndex);
              const primerDiaSem = diasMes[0].getDay();
              const offsetInicio = primerDiaSem === 0 ? 6 : primerDiaSem - 1;
              
              const celdasMinical: ({ tipo: 'vacio' } | { tipo: 'dia'; nDia: number })[] = [];
              for (let i = 0; i < offsetInicio; i++) {
                celdasMinical.push({ tipo: 'vacio' });
              }
              diasMes.forEach(d => {
                celdasMinical.push({ tipo: 'dia', nDia: d.getDate() });
              });

              return (
                <div 
                  key={m.mesIndex}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-sm space-y-3 ${
                    esHoyMes 
                      ? 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-200' 
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Mes Header */}
                    <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                      <h5 className="font-bold text-gray-800 text-sm capitalize">{m.nombreMes}</h5>
                      {esHoyMes && (
                        <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                          Mes en curso
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded">
                      <span>Días: <b>{m.diasDelMesCount}</b></span>
                      <span>Feriados: <b className="text-red-500">{m.feriadosMes.length}</b></span>
                    </div>

                    {/* MINI CALENDARIO DE DÍAS DEL MES (Grilla Lu-Do con días seleccionables 1..31) */}
                    <div className="bg-gray-50/90 p-2 rounded-lg border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between">
                        <span>Días del Mes</span>
                        <span className="text-[9px] text-indigo-600 font-normal">Click día para ver</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400 mb-1">
                        <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {celdasMinical.map((celda, cIdx) => {
                          if (celda.tipo === 'vacio') {
                            return <div key={cIdx} className="h-5"></div>;
                          }
                          const nDia = celda.nDia!;
                          const dateObj = new Date(anoActual, m.mesIndex, nDia);
                          const isSelectedDay = fechaActual.toDateString() === dateObj.toDateString();
                          const esFeriado = m.feriadosMes.some(f => f.dia === nDia);
                          const esFinSemana = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => {
                                setFechaActual(dateObj);
                                setViewType('diario');
                              }}
                              className={`h-5.5 rounded text-[9.5px] font-bold flex items-center justify-center transition-all ${
                                isSelectedDay 
                                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' 
                                  : esFeriado 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : esFinSemana 
                                      ? 'bg-gray-100 text-red-400 hover:bg-gray-200'
                                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600'
                              }`}
                              title={`${nDia} de ${m.nombreMes} ${anoActual}${esFeriado ? ' (Feriado)' : ''} — Haz clic para ver vista diaria`}
                            >
                              {nDia}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lista de Colaboradores en este Mes (Horas Mensuales y Editables) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">
                        Colaboradores (Horas Mensuales)
                      </div>
                      <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-0.5 custom-scrollbar">
                        {m.datosColaboradores.map((item) => (
                          <div 
                            key={item.profesional.id}
                            className="p-2 border border-gray-200 rounded-lg bg-gray-50/80 hover:bg-indigo-50/50 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                            onClick={() => handleAbrirModalEdit(item.profesional, m.mesIndex)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800 truncate max-w-[120px]" title={item.profesional.nombre}>
                                {item.profesional.nombre}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded text-[11px]">
                                  {item.horasFinales.toFixed(1)}h
                                </span>
                                <span
                                  className="text-amber-500 group-hover:scale-110 transition-transform text-xs"
                                  title="Editar horas de este colaborador"
                                >
                                  ✏️
                                </span>
                              </div>
                            </div>

                            {/* Reflejo explícito si se restaron o sumaron horas con comentario/motivo */}
                            {item.ajuste && (
                              <div className={`text-[10px] p-1.5 rounded border font-medium mt-0.5 ${
                                item.cambioDiferencia < 0 
                                  ? 'bg-red-50 border-red-200 text-red-700' 
                                  : item.cambioDiferencia > 0 
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                                <div className="flex items-center justify-between font-bold">
                                  <span>
                                    {item.cambioDiferencia < 0 ? `🔻 Se restaron ${Math.abs(item.cambioDiferencia)} hrs` : `🔺 Se sumaron ${item.cambioDiferencia} hrs`}
                                  </span>
                                  <span className="text-[9px] opacity-75">Base: {item.horasBase}h</span>
                                </div>
                                <div className="mt-0.5 italic text-[9.5px] truncate" title={item.ajuste.motivo}>
                                  💬 Motivo: "{item.ajuste.motivo}"
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg">
                    <span className="text-xs text-gray-700 font-semibold">Total Mes:</span>
                    <span className="text-sm font-bold text-indigo-800">
                      {m.totalHorasMes.toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla Desglose Anual por Profesional con celdas editables */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-700 text-sm">
              Tabla Desglose Mensual por Colaborador ({anoActual})
            </span>
            <span className="text-xs text-gray-500">
              💡 Haz clic en cualquier celda para ajustar u ofrecer observaciones de horas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 border-r">Colaborador</th>
                  {meses.map((m, idx) => (
                    <th key={idx} className="px-2 py-2.5 text-center font-semibold text-gray-600">
                      {m.substring(0, 3)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center font-bold text-gray-700 bg-gray-200/70 border-l">Total Sin Salida</th>
                  <th className="px-3 py-2.5 text-center font-bold text-indigo-900 bg-indigo-100/80 border-l">Total Con Salida</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profesionalesFiltrados.map((prof) => {
                  let totalSinSalidaProf = 0;
                  let totalConSalidaProf = 0;
                  const mesesInfo = meses.map((_, mesIdx) => {
                    const info = getHorasMesProf(prof, anoActual, mesIdx);
                    totalSinSalidaProf += info.horasBase;
                    totalConSalidaProf += info.horasFinales;
                    return { mesIdx, ...info };
                  });

                  return (
                    <tr key={prof.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r flex justify-between items-center gap-2">
                        <span>{prof.nombre}</span>
                      </td>
                      {mesesInfo.map((mInfo) => (
                        <td 
                          key={mInfo.mesIdx} 
                          onClick={() => handleAbrirModalEdit(prof, mInfo.mesIdx)}
                          className={`px-2 py-2 text-center cursor-pointer transition-all hover:bg-indigo-100/50 relative group ${
                            mInfo.ajuste ? (mInfo.cambioDiferencia < 0 ? 'bg-red-50/60' : 'bg-green-50/60') : ''
                          }`}
                          title={mInfo.ajuste ? `Ajuste: ${mInfo.cambioDiferencia > 0 ? '+' : ''}${mInfo.cambioDiferencia}h - "${mInfo.ajuste.motivo}" (Click para editar)` : 'Click para editar/ajustar horas'}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span className={`font-semibold ${mInfo.ajuste ? (mInfo.cambioDiferencia < 0 ? 'text-red-700' : 'text-green-700') : 'text-gray-800'}`}>
                              {mInfo.horasFinales.toFixed(0)}h
                            </span>
                            {mInfo.ajuste && (
                              <span className={`text-[9px] font-bold px-1 rounded ${mInfo.cambioDiferencia < 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                                {mInfo.cambioDiferencia < 0 ? `🔻${mInfo.cambioDiferencia}` : `🔺+${mInfo.cambioDiferencia}`}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold text-gray-700 bg-gray-50 border-l" title="Total horas base del año sin modificaciones">
                        {totalSinSalidaProf.toFixed(1)} hrs
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-indigo-700 bg-indigo-50/70 border-l" title="Total horas del año con suma y resta de horas aplicadas">
                        {totalConSalidaProf.toFixed(1)} hrs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    } else if (viewType === 'mensual') {
      nuevaFecha.setMonth(fechaActual.getMonth() + dias);
    } else if (viewType === 'anual') {
      nuevaFecha.setFullYear(fechaActual.getFullYear() + dias);
    }
    setFechaActual(nuevaFecha);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        {/* Botones de Vista en orden: ANUAL - MENSUAL - SEMANAL - DIARIO */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('anual')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewType === 'anual' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📈 Anual
          </button>
          <button
            onClick={() => setViewType('mensual')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewType === 'mensual' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📊 Mensual
          </button>
          <button
            onClick={() => setViewType('semanal')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewType === 'semanal' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📆 Semanal
          </button>
          <button
            onClick={() => setViewType('diario')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewType === 'diario' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📅 Diario
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            title="Anterior"
          >
            ◀
          </button>

          {/* Nombre del mes en curso / fecha navegada que se actualiza dinámicamente */}
          <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
            {viewType === 'anual' && `Año ${fechaActual.getFullYear()}`}
            {viewType === 'mensual' && `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`}
            {viewType === 'semanal' && (() => {
              const sem = getSemanaActual(fechaActual);
              const m1 = meses[sem[0].getMonth()];
              const m2 = meses[sem[6].getMonth()];
              return m1 === m2 
                ? `Semana del ${sem[0].getDate()} al ${sem[6].getDate()} de ${m1}`
                : `Semana del ${sem[0].getDate()} de ${m1} al ${sem[6].getDate()} de ${m2}`;
            })()}
            {viewType === 'diario' && `${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`}
          </span>

          <button
            onClick={() => cambiarFecha(1)}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            title="Siguiente"
          >
            ▶
          </button>

          {/* Selector rápido de mes en curso */}
          <select
            value={fechaActual.getMonth()}
            onChange={(e) => {
              const nuevaFecha = new Date(fechaActual);
              nuevaFecha.setMonth(parseInt(e.target.value, 10));
              setFechaActual(nuevaFecha);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-700"
            title="Seleccionar Mes"
          >
            {meses.map((mesNombre, idx) => (
              <option key={idx} value={idx}>{mesNombre}</option>
            ))}
          </select>

          {/* Selector interactivo de fecha con calendario popover */}
          <input
            type="date"
            value={fechaActual.toISOString().split('T')[0]}
            onChange={(e) => {
              if (e.target.value) {
                const parts = e.target.value.split('-');
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                setFechaActual(d);
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-700 cursor-pointer"
            title="Abrir calendario para seleccionar día específico"
          />

          <button
            onClick={() => setFechaActual(new Date())}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
          >
            Hoy
          </button>
        </div>
        
        <select
          value={selectedProfesional}
          onChange={(e) => setSelectedProfesional(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todos los colaboradores</option>
          {profesionales.filter(p => p.activo).map(prof => (
            <option key={prof.id} value={prof.id}>{prof.nombre}</option>
          ))}
        </select>
      </div>
      
      {viewType === 'anual' && renderVistaAnual()}
      {viewType === 'mensual' && renderVistaMensual()}
      {viewType === 'semanal' && renderVistaSemanal()}
      {viewType === 'diario' && renderVistaDiaria()}

      {/* Modal de Ajuste de Horas con Calendario Interactivo para Selección de Día(s) */}
      {modalEditState.open && modalEditState.profesional && modalEditState.mesIndex !== undefined && (() => {
        const mAno = modalEditState.ano || fechaActual.getFullYear();
        const mMes = modalEditState.mesIndex;
        const diasMes = getDiasDelMes(mAno, mMes);
        const primerDiaSem = diasMes[0].getDay();
        const offsetInicio = primerDiaSem === 0 ? 6 : primerDiaSem - 1;
        const feriadosMesModal = getFeriadosChile(mAno).filter(f => f.mes === mMes);

        const celdasModalCalendar: ({ tipo: 'vacio' } | { tipo: 'dia'; nDia: number })[] = [];
        for (let i = 0; i < offsetInicio; i++) {
          celdasModalCalendar.push({ tipo: 'vacio' });
        }
        diasMes.forEach(d => {
          celdasModalCalendar.push({ tipo: 'dia', nDia: d.getDate() });
        });

        const infoActual = getHorasMesProf(modalEditState.profesional, mAno, mMes);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto border border-gray-100">
              {/* Header Modal */}
              <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    ✏️ Ajustar Horas Mensuales
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                    {modalEditState.profesional.nombre} — {meses[mMes]} {mAno}
                  </p>
                </div>
                <button 
                  onClick={() => setModalEditState({ open: false })}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                {/* Horas base */}
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex justify-between items-center shadow-xs">
                  <span className="text-indigo-900 font-semibold">Horas Base Calculadas del Mes:</span>
                  <span className="text-indigo-700 font-extrabold text-base">
                    {infoActual.horasBase} hrs
                  </span>
                </div>

                {/* Tipo de Operación */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Tipo de Operación:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditTipo('restar')}
                      className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs flex items-center justify-center gap-1.5 ${
                        editTipo === 'restar' 
                          ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>🔻</span> Restar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTipo('sumar')}
                      className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs flex items-center justify-center gap-1.5 ${
                        editTipo === 'sumar' 
                          ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>🔺</span> Sumar
                    </button>
                  </div>
                </div>

                {/* CALENDARIO INTERACTIVO PARA SELECCIÓN DE DÍA(S) */}
                <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      <span>🗓️</span> Seleccionar día(s) en el calendario:
                    </label>
                    {editDiasSeleccionados.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditDiasSeleccionados([])}
                        className="text-[11px] text-red-600 font-bold hover:underline bg-red-50 px-2 py-0.5 rounded-md border border-red-100"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>

                  <p className="text-[10.5px] text-gray-500">
                    Haz clic en los días del mes para {editTipo === 'restar' ? 'restar' : editTipo === 'sumar' ? 'sumar' : 'definir'} las horas laborales de esa fecha.
                  </p>

                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-2 shadow-xs">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase">
                      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {celdasModalCalendar.map((celda, cIdx) => {
                        if (celda.tipo === 'vacio') {
                          return <div key={cIdx} className="h-7"></div>;
                        }
                        const nDia = celda.nDia!;
                        const isSelected = editDiasSeleccionados.includes(nDia);
                        const dateObj = new Date(mAno, mMes, nDia);
                        const esFeriado = feriadosMesModal.some(f => f.dia === nDia);
                        const esFinSemana = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleToggleDiaModal(nDia)}
                            className={`h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                              isSelected
                                ? editTipo === 'restar' 
                                  ? 'bg-red-600 text-white border-red-700 shadow ring-2 ring-red-300 scale-105' 
                                  : 'bg-green-600 text-white border-green-700 shadow ring-2 ring-green-300 scale-105'
                                : esFeriado
                                  ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                  : esFinSemana
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                    : 'bg-white text-gray-800 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                            title={`Día ${nDia} ${esFeriado ? '(Feriado)' : ''}`}
                          >
                            {nDia}
                          </button>
                        );
                      })}
                    </div>

                    {editDiasSeleccionados.length > 0 ? (
                      <div className="mt-2 text-[11px] bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-indigo-900 flex justify-between items-center font-medium">
                        <span>Días seleccionados ({editDiasSeleccionados.length}): <b>{editDiasSeleccionados.join(', ')}</b></span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10.5px] text-gray-400 italic text-center">
                        💡 Haz clic en los días arriba para seleccionarlos automáticamente
                      </div>
                    )}
                  </div>
                </div>



                {/* Input total de horas */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {editTipo === 'restar' ? 'Cantidad Total de Horas a Restar:' : 'Cantidad Total de Horas a Sumar:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="400"
                    placeholder={
                      editTipo === 'restar' 
                        ? 'Ej. Selecciona día(s) arriba o ingresa las horas a restar...' 
                        : 'Ej. Selecciona día(s) arriba o ingresa las horas a sumar...'
                    }
                    value={editCantidad}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditCantidad(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm bg-white placeholder:font-normal placeholder:text-gray-400 placeholder:text-xs"
                  />
                  <p className="text-[10.5px] text-gray-500 mt-1">
                    💡 Selecciona día(s) en el calendario superior para autocalcular las horas o ingresa la cantidad manualmente.
                  </p>
                </div>

                {/* Comentario / Motivo */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Comentario / Motivo del Ajuste <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Vacaciones tomadas 2 días / Licencia médica / Horas extras en proyecto RPA..."
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Este comentario quedará visible en la vista del mes indicando el motivo del cambio de horas.
                  </p>
                </div>
              </div>

              {/* Botones modal */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 gap-2">
                {infoActual.ajuste ? (
                  <button
                    type="button"
                    onClick={handleEliminarAjuste}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-colors"
                  >
                    Restablecer
                  </button>
                ) : <div></div>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEditState({ open: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarAjuste}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-semibold shadow-md transition-all hover:shadow-lg"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const Profesionales: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profesionales' | 'calendario'>('profesionales');
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudProyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ajustesHoras, setAjustesHoras] = useState<AjusteHoraMes[]>(() => {
    try {
      const stored = localStorage.getItem('rpa_ajustes_horas_colaboradores');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState<Profesional | null>(null);
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
  const defaultHorario = {
    lunes: { activo: true, entrada: '09:00', salida: '17:00' },
    martes: { activo: true, entrada: '09:00', salida: '17:00' },
    miercoles: { activo: true, entrada: '09:00', salida: '17:00' },
    jueves: { activo: true, entrada: '09:00', salida: '17:00' },
    viernes: { activo: true, entrada: '09:00', salida: '17:00' },
    sabado: { activo: false, entrada: '09:00', salida: '17:00' },
    domingo: { activo: false, entrada: '09:00', salida: '17:00' }
  };

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cargo: '',
    horasDisponibles: 173,
    horario: defaultHorario
  });

  const [profFormAno, setProfFormAno] = useState<number>(new Date().getFullYear());
  const [profFormMes, setProfFormMes] = useState<number>(new Date().getMonth());
  const [profFormTipo, setProfFormTipo] = useState<'restar' | 'sumar'>('restar');
  const [profFormDias, setProfFormDias] = useState<number[]>([]);
  const [profFormCantidad, setProfFormCantidad] = useState<number | ''>('');
  const [profFormMotivo, setProfFormMotivo] = useState<string>('');

  const handleProfFormMesAnoChange = (nuevoAno: number, nuevoMes: number, profId?: string) => {
    setProfFormAno(nuevoAno);
    setProfFormMes(nuevoMes);
    const targetId = profId || editingProfesional?.id;
    if (targetId) {
      const ajuste = ajustesHoras.find(
        a => a.profesionalId === targetId && a.ano === nuevoAno && a.mes === nuevoMes
      );
      if (ajuste) {
        setProfFormTipo(ajuste.tipo === 'sumar' ? 'sumar' : 'restar');
        setProfFormDias(ajuste.diasSeleccionados || []);
        setProfFormCantidad(ajuste.cantidad);
        setProfFormMotivo(ajuste.motivo || '');
      } else {
        setProfFormTipo('restar');
        setProfFormDias([]);
        setProfFormCantidad('');
        setProfFormMotivo('');
      }
    } else {
      setProfFormTipo('restar');
      setProfFormDias([]);
      setProfFormCantidad('');
      setProfFormMotivo('');
    }
  };

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

  const calcularHorasSemanales = (horario: any): number => {
    let totalHoras = 0;
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dias.forEach(dia => {
      if (horario[dia] && horario[dia].activo) {
        totalHoras += calcularHorasDia(horario[dia].entrada, horario[dia].salida);
      }
    });
    return totalHoras;
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
        // Asegurar que los profesionales tengan 40 horas semanales por defecto (09:00 a 17:00 L-V)
        const profesionalesConHorario = profesionalesData.map((prof: any) => {
          const defaultStandardHorario = {
            lunes: { activo: true, entrada: '09:00', salida: '17:00' },
            martes: { activo: true, entrada: '09:00', salida: '17:00' },
            miercoles: { activo: true, entrada: '09:00', salida: '17:00' },
            jueves: { activo: true, entrada: '09:00', salida: '17:00' },
            viernes: { activo: true, entrada: '09:00', salida: '17:00' },
            sabado: { activo: false, entrada: '09:00', salida: '17:00' },
            domingo: { activo: false, entrada: '09:00', salida: '17:00' }
          };

          let finalHorario = defaultStandardHorario;
          if (prof.horario) {
            const horasSemanalesActuales = calcularHorasSemanales(prof.horario);
            // Si el horario guardado es menor o igual a 40 y mayor a 0, se respeta; si excede 40 o no tiene horario, se ajusta a 40 horas
            if (horasSemanalesActuales <= 40.0 && horasSemanalesActuales > 0) {
              finalHorario = prof.horario;
            }
          }

          const horasSemanalesFinales = calcularHorasSemanales(finalHorario);
          const horasMesFinales = Math.round(horasSemanalesFinales * 4.33);

          return {
            ...prof,
            horasDisponibles: horasMesFinales,
            horario: finalHorario
          };
        });
        setProfesionales(profesionalesConHorario);
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

      // Guardar ajuste de horas si se especificó cantidad o días
      const cantidadNumerica = Number(profFormCantidad) || 0;
      const targetId = editingProfesional?.id || (profesionales.find(p => p.email === formData.email)?.id);
      if (cantidadNumerica > 0 && targetId) {
        const nuevoAjuste: AjusteHoraMes = {
          profesionalId: targetId,
          profesionalNombre: formData.nombre,
          ano: profFormAno,
          mes: profFormMes,
          tipo: profFormTipo,
          cantidad: cantidadNumerica,
          diasSeleccionados: profFormDias,
          horasPorDia: 8,
          motivo: profFormMotivo.trim() || 'Ajuste desde Edición de Colaborador',
          fechaActualizacion: new Date().toISOString()
        };

        const actualizados = [
          ...ajustesHoras.filter(
            a => !(a.profesionalId === nuevoAjuste.profesionalId && a.ano === nuevoAjuste.ano && a.mes === nuevoAjuste.mes)
          ),
          nuevoAjuste
        ];

        setAjustesHoras(actualizados);
        localStorage.setItem('rpa_ajustes_horas_colaboradores', JSON.stringify(actualizados));
      }

    } catch (error: any) {
      console.error('Error guardando profesional:', error);
      addNotification('error', error.response?.data?.message || 'Error al guardar profesional');
    }

    setFormData({
      nombre: '',
      email: '',
      cargo: '',
      horasDisponibles: 173,
      horario: defaultHorario
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
    const hoy = new Date();
    const ano = hoy.getFullYear();
    const mes = hoy.getMonth();
    handleProfFormMesAnoChange(ano, mes, profesional.id);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
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
              <h1 className="text-xl font-semibold text-gray-800">Gestión de Colaboradores</h1>
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
                      horasDisponibles: 173,
                      horario: defaultHorario
                    });
                    setShowModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Colaborador
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
              Colaboradores
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
                          No hay colaboradores registrados. Haz clic en "Nuevo Colaborador" para agregar.
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
                                onClick={() => handleDeleteClick(prof.id)}
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
                  <h3 className="text-sm font-medium text-gray-500">Total Colaboradores</h3>
                  <p className="text-2xl font-bold text-gray-900">{profesionales.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500">Colaboradores Activos</h3>
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



        {activeTab === 'calendario' && (
          <CalendarView 
            profesionales={profesionales} 
            fechaActual={fechaCalendario}
            setFechaActual={setFechaCalendario}
            ajustesHoras={ajustesHoras}
            setAjustesHoras={setAjustesHoras}
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
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
              <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingProfesional ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProfesional(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
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
                    placeholder="Ej: Juan Pérez"
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
                    placeholder="ejemplo@ofimundo.cl"
                  />
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
                    Horas disponibles por mes *
                  </label>
                  <input
                    type="number"
                    value={formData.horasDisponibles}
                    onChange={(e) => setFormData({ ...formData, horasDisponibles: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Por defecto 173 hrs/mes (equivalente a 40.0 hrs/semana de Lunes a Viernes).
                  </p>
                </div>

                {/* Sección de Ajustes de Horas y Calendario */}
                {(() => {
                  const diasMesProfForm = getDiasDelMes(profFormAno, profFormMes);
                  const feriadosMesProfForm = getFeriadosChile(profFormAno).filter(f => f.mes === profFormMes);
                  const primerDiaSemProfForm = diasMesProfForm[0].getDay();
                  const offsetInicioProfForm = primerDiaSemProfForm === 0 ? 6 : primerDiaSemProfForm - 1;

                  const celdasModalEditProf: ({ tipo: 'vacio' } | { tipo: 'dia'; nDia: number })[] = [];
                  for (let i = 0; i < offsetInicioProfForm; i++) {
                    celdasModalEditProf.push({ tipo: 'vacio' });
                  }
                  diasMesProfForm.forEach(d => {
                    celdasModalEditProf.push({ tipo: 'dia', nDia: d.getDate() });
                  });

                  return (
                    <div className="pt-4 border-t border-gray-200 space-y-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <span>🗓️</span> Ajuste de Horas & Calendario por Mes
                        </h3>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                          Mes y Día
                        </span>
                      </div>

                      {/* Seleccionar Año y Mes */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Año:</label>
                          <select
                            value={profFormAno}
                            onChange={(e) => handleProfFormMesAnoChange(Number(e.target.value), profFormMes)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                          >
                            {[2024, 2025, 2026, 2027, 2028].map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Mes:</label>
                          <select
                            value={profFormMes}
                            onChange={(e) => handleProfFormMesAnoChange(profFormAno, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                          >
                            {meses.map((m, idx) => (
                              <option key={idx} value={idx}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tipo de Operación: Restar / Sumar */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Tipo de Operación:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setProfFormTipo('restar')}
                            className={`py-1.5 px-3 rounded-lg font-bold text-center border transition-all text-xs flex items-center justify-center gap-1 ${
                              profFormTipo === 'restar' 
                                ? 'bg-red-600 text-white border-red-600 shadow ring-2 ring-red-200' 
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span>🔻</span> Restar Horas
                          </button>
                          <button
                            type="button"
                            onClick={() => setProfFormTipo('sumar')}
                            className={`py-1.5 px-3 rounded-lg font-bold text-center border transition-all text-xs flex items-center justify-center gap-1 ${
                              profFormTipo === 'sumar' 
                                ? 'bg-green-600 text-white border-green-600 shadow ring-2 ring-green-200' 
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span>🔺</span> Sumar Horas
                          </button>
                        </div>
                      </div>

                      {/* CALENDARIO DE DÍAS DEL MES SELECCIONADO */}
                      <div className="border border-indigo-100 rounded-xl p-2.5 bg-white space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            <span>🗓️</span> Seleccionar día(s) en {meses[profFormMes]} {profFormAno}:
                          </span>
                          {profFormDias.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfFormDias([]);
                                setProfFormCantidad('');
                              }}
                              className="text-[10px] text-red-600 font-bold hover:underline"
                            >
                              Limpiar días
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase">
                          <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {celdasModalEditProf.map((celda, cIdx) => {
                            if (celda.tipo === 'vacio') {
                              return <div key={cIdx} className="h-6"></div>;
                            }
                            const nDia = celda.nDia!;
                            const isSelected = profFormDias.includes(nDia);
                            const dateObj = new Date(profFormAno, profFormMes, nDia);
                            const esFeriado = feriadosMesProfForm.some(f => f.dia === nDia);
                            const esFinSemana = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => {
                                  let nuevos: number[];
                                  if (profFormDias.includes(nDia)) {
                                    nuevos = profFormDias.filter(d => d !== nDia);
                                  } else {
                                    nuevos = [...profFormDias, nDia].sort((a, b) => a - b);
                                  }
                                  setProfFormDias(nuevos);
                                  if (nuevos.length > 0) {
                                    setProfFormCantidad(nuevos.length * 8);
                                  } else {
                                    setProfFormCantidad('');
                                  }
                                }}
                                className={`h-6 rounded text-xs font-bold transition-all flex items-center justify-center border ${
                                  isSelected
                                    ? profFormTipo === 'restar' 
                                      ? 'bg-red-600 text-white border-red-700 shadow ring-2 ring-red-300' 
                                      : 'bg-green-600 text-white border-green-700 shadow ring-2 ring-green-300'
                                    : esFeriado
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : esFinSemana
                                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                                        : 'bg-white text-gray-800 border-gray-200 hover:bg-indigo-50'
                                }`}
                                title={`Día ${nDia} ${esFeriado ? '(Feriado)' : ''}`}
                              >
                                {nDia}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Horas total a sumar/restar */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {profFormTipo === 'restar' ? 'Horas a Restar:' : 'Horas a Sumar:'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          placeholder="Ej: 8, 16 (o selecciona días arriba)..."
                          value={profFormCantidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfFormCantidad(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                        />
                      </div>

                      {/* Motivo */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Motivo / Comentario del Ajuste:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Licencia médica / Vacaciones / Horas extras..."
                          value={profFormMotivo}
                          onChange={(e) => setProfFormMotivo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
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