import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemandaItem } from '../types/demanda';
import demandaService from '../services/demandaService';
import api from '../services/api';

export const AREAS_SOLICITANTES = [
  'Admin & Fin',
  'Operaciones',
  'G. General',
  'Experiencia Clientes',
  'Experiencia Colaboradores',
  'Empresa Dreamtec',
  'Empresa Global Horizon',
  'Empresa Hiway',
  'Comercial'
];

export const ESTADOS_DEMANDA = [
  'Solicitud',
  'Evaluación',
  'Pendiente Comité',
  'Aprobado',
  'Priorizado',
  'En Ejecución',
  'Completado',
  'Pendiente información',
  'Postergado',
  'Pausado',
  'Rechazado',
  'Cancelado'
];

export const DECISIONES_COMITE = [
  { id: 'Pendiente', label: '⚪ Pendiente', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'Aprobado', label: '🟢 Aprobado', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
  { id: 'Postergado', label: '⏸️ Postergado', badgeClass: 'bg-amber-50 text-amber-900 border-amber-300' },
  { id: 'Rechazado', label: '🔴 Rechazado', badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold' },
];

export const PRIORIDADES_DEMANDA = ['Alta', 'Media', 'Baja'];

export const SEMAFOROS_DEMANDA = [
  { id: 'Verde', label: '🟢 Verde', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
  { id: 'Amarillo', label: '🟡 Amarillo', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' },
  { id: 'Rojo', label: '🔴 Rojo', badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold' },
];

export const ETAPAS_SEQUENTIAL = [
  { id: 'Ingreso', shortLabel: '1. Ingreso', fullLabel: '1. Ingreso', icon: '🟡' },
  { id: 'Evaluación', shortLabel: '2. Evaluación', fullLabel: '2. Evaluación', icon: '🔵' },
  { id: 'Priorización', shortLabel: '3. Priorización', fullLabel: '3. Priorización', icon: '🟣' },
  { id: 'Comité', shortLabel: '4. Comité', fullLabel: '4. Comité', icon: '🟦' },
  { id: 'Ejecución', shortLabel: '5. Ejecución', fullLabel: '5. Ejecución', icon: '🟠' },
  { id: 'Aprobación Usuario', shortLabel: '6. Apr. Usuario', fullLabel: '6. Aprobación Usuario', icon: '🟪' },
  { id: 'Capacitación', shortLabel: '7. Capacitación', fullLabel: '7. Capacitación', icon: '🎓' },
  { id: 'Cierre', shortLabel: '8. Cierre', fullLabel: '8. Cierre', icon: '🟢' },
];

const getDecisionComiteBadgeClass = (decision?: string): string => {
  const match = DECISIONES_COMITE.find(d => d.id === decision);
  return match ? match.badgeClass : 'bg-gray-100 text-gray-500 border-gray-200';
};

const getSemaforoBadgeClass = (semaforo?: string): string => {
  const match = SEMAFOROS_DEMANDA.find(s => s.id === semaforo);
  return match ? match.badgeClass : 'bg-gray-100 text-gray-500 border-gray-200';
};

const getPrioridadBadgeClass = (p?: string): string => {
  switch ((p || '').toLowerCase()) {
    case 'alta': return 'bg-red-100 text-red-700 border-red-200 font-bold';
    case 'media': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'baja': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getEstadoBadgeClass = (e?: string): string => {
  switch (e) {
    case 'Aprobado': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    case 'En Ejecución': return 'bg-orange-100 text-orange-800 border-orange-200 font-semibold';
    case 'Completado': return 'bg-green-100 text-green-800 border-green-200 font-semibold';
    case 'Rechazado': return 'bg-red-100 text-red-800 border-red-200 font-bold';
    case 'Cancelado': return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
    case 'Postergado': return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'Pausado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Pendiente información': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
};

const getStageFromItem = (item: Partial<DemandaItem>): string => {
  if (item.etapa && ETAPAS_SEQUENTIAL.some(s => s.id === item.etapa)) {
    return item.etapa;
  }
  if (item.etapa === 'Solicitud' || item.etapa === 'Prospecto' || item.etapa === 'Ficha' || item.etapa === 'Levantamiento') return 'Ingreso';
  if (item.etapa === 'Pendiente Comité') return 'Comité';
  if (item.etapa === 'Priorizado') return 'Priorización';
  if (item.etapa === 'En Ejecución') return 'Ejecución';
  if (item.etapa === 'Completado') return 'Cierre';
  return 'Ingreso';
};

const getEtapaBadgeClass = (etapa: string): string => {
  switch (etapa) {
    case 'Ingreso': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Evaluación': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Priorización': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Comité': return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'Ejecución': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Aprobación Usuario': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Capacitación': return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'Cierre': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
};

const calculateTiempoEstimadoAuto = (item: Partial<DemandaItem>): string => {
  if (item.tiempoEstimadoCompleto) return item.tiempoEstimadoCompleto;
  if (item.planificacionEstimada && item.fechaEstimadaEntrega) {
    const inicio = new Date(item.planificacionEstimada);
    const entrega = new Date(item.fechaEstimadaEntrega);
    if (!isNaN(inicio.getTime()) && !isNaN(entrega.getTime())) {
      const diffTime = entrega.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        if (diffDays >= 30) {
          const meses = (diffDays / 30).toFixed(1).replace('.0', '');
          return `${diffDays} días (~${meses} ${meses === '1' ? 'mes' : 'meses'})`;
        }
        return `${diffDays} días`;
      }
    }
  }
  return '-';
};

// Componente Stepper de 8 Etapas ("Pedido viajando")
const ProjectLifecycleStepper: React.FC<{
  currentStage: string;
  onStageChange: (stage: string) => void;
}> = ({ currentStage, onStageChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getStageIndex = (stage: string) => {
    const idx = ETAPAS_SEQUENTIAL.findIndex(s => s.id === stage);
    return idx !== -1 ? idx : 0;
  };

  const currentIndex = getStageIndex(currentStage);
  const currentSeqObj = ETAPAS_SEQUENTIAL.find(s => s.id === currentStage);

  return (
    <div className="bg-gradient-to-r from-slate-50 via-indigo-50/60 to-purple-50 p-3.5 rounded-xl border border-indigo-100 shadow-xs my-3 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">📦</span>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Etapa del Proyecto (Trazabilidad 8 Pasos)
          </span>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-xs border ${getEtapaBadgeClass(currentStage)}`}>
          {`${currentSeqObj?.icon || '🟡'} ${currentStage}`}
        </span>
      </div>

      {/* Bar & Steps */}
      <div className="relative my-3 px-1">
        <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 rounded -z-0">
          <div 
            className="h-1 transition-all duration-500 rounded bg-indigo-600"
            style={{ width: `${(currentIndex / (ETAPAS_SEQUENTIAL.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-start relative z-10 w-full">
          {ETAPAS_SEQUENTIAL.map((st, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div 
                key={st.id} 
                onClick={() => onStageChange(st.id)}
                className="flex flex-col items-center cursor-pointer group flex-1 min-w-0 px-0.5 text-center"
                title={`Cambiar a etapa: ${st.fullLabel}`}
              >
                <div className="h-5 flex items-center justify-center mb-0.5">
                  {isCurrent && (
                    <div className="animate-bounce flex items-center gap-0.5 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-md font-bold whitespace-nowrap">
                      <span>🚀</span>
                      <span className="hidden sm:inline">Aquí</span>
                    </div>
                  )}
                </div>

                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 transform group-hover:scale-110 shadow-xs ${
                  isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110' :
                  isCompleted ? 'bg-emerald-500 text-white' :
                  'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : st.icon}
                </div>

                <div className="mt-1.5 w-full">
                  <span className={`block text-[10px] font-bold leading-tight truncate ${
                    isCurrent ? 'text-indigo-900 font-extrabold' :
                    isCompleted ? 'text-emerald-700' : 'text-gray-500'
                  }`} title={st.fullLabel}>
                    {st.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-indigo-100/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] text-gray-500 font-medium">Selector de Etapas:</span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200 cursor-pointer"
          >
            <span>⚙️ {isExpanded ? 'Ocultar Opciones' : 'Cambiar Etapa (8 Opciones)'}</span>
            <span className="text-[9px]">{isExpanded ? '🔼' : '🔽'}</span>
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-2 mt-2 pt-2 border-t border-indigo-100/40 text-xs">
            <div className="flex flex-wrap gap-1">
              {ETAPAS_SEQUENTIAL.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onStageChange(st.id)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    currentStage === st.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
                  }`}
                >
                  {st.icon} {st.fullLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GestionDemanda: React.FC = () => {
  const navigate = useNavigate();
  const [demandas, setDemandas] = useState<DemandaItem[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string }[]>([]);
  const [prospectos, setProspectos] = useState<{ id: string; codigo: string; nombreProyecto: string; cliente?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterArea, setFilterArea] = useState<string>('todas');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterDecisionComite, setFilterDecisionComite] = useState<string>('todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todas');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DemandaItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State (observaciones totalmente vacío por defecto sin texto automático)
  const [formData, setFormData] = useState<Partial<DemandaItem>>({
    codigo: '',
    proyecto: '',
    tipoProyecto: 'Interno',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    area: 'Comercial',
    responsableTI: '',
    estado: 'Solicitud',
    decisionComite: 'Pendiente',
    prioridad: 'Media',
    semaforo: 'Verde',
    etapa: 'Ingreso',
    fechaComite: '',
    planificacionEstimada: new Date().toISOString().split('T')[0],
    planificacionReal: '',
    fechaEstimadaEntrega: '',
    fechaEntregaReal: '',
    tiempoEstimadoCompleto: '',
    tiempoEstimadoAjuste: '',
    solicitante: '',
    observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [demandasData, profRes, prospectosRes] = await Promise.all([
        demandaService.getAll(),
        api.get('/profesionales').catch(() => ({ data: [] })),
        api.get('/fichas-prospecto').catch(() => ({ data: [] }))
      ]);

      const rawProspectos = prospectosRes.data?.data || prospectosRes.data || [];
      const parsedProspectos = Array.isArray(rawProspectos) ? rawProspectos.map((p: any) => ({
        id: String(p.id),
        codigo: p.codigo || p.Codigo || `PR-${p.id}`,
        nombreProyecto: p.nombreProyecto || p.NombreProyecto || '',
        cliente: p.cliente || p.Cliente || ''
      })) : [];

      setProspectos(parsedProspectos);

      const rawProfs = profRes.data?.data || profRes.data || [];
      if (Array.isArray(rawProfs)) {
        setProfesionales(rawProfs.map((p: any) => ({ id: String(p.id), nombre: p.nombre || p.nombreProyecto || 'Colaborador' })));
      }

      const cleanedDemandas = (demandasData || []).map(d => {
        const matchingProspecto = parsedProspectos.find(p => 
          p.nombreProyecto.trim().toLowerCase() === (d.proyecto || '').trim().toLowerCase()
        );
        
        const finalCodigo = (d.codigo && !d.codigo.startsWith('DEM-')) 
          ? d.codigo 
          : (matchingProspecto ? matchingProspecto.codigo : (d.codigo || ''));

        const obs = d.observaciones || '';
        const isAutoText = obs.includes('Actualizado desde Prospect') || 
                           obs.includes('Sincronizado') || 
                           obs.includes('Ficha creada') || 
                           obs.includes('Traspasado desde');
        
        return {
          ...d,
          codigo: finalCodigo,
          observaciones: isAutoText ? '' : obs
        };
      });

      setDemandas(cleanedDemandas);
    } catch (err: any) {
      console.error('Error cargando gestión de demanda:', err);
      setError('Error al cargar los registros de demanda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick update helpers
  const handleQuickUpdateField = async (id: string, fields: Partial<DemandaItem>) => {
    try {
      setUpdatingId(id);
      const updated = await demandaService.update(id, fields);
      setDemandas(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Error en actualización rápida:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConvertToFicha = async (item: DemandaItem) => {
    navigate('/fichas-proyecto', { state: { convertFromDemanda: item } });
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const firstProspecto = prospectos[0];
    setFormData({
      codigo: firstProspecto ? firstProspecto.codigo : '',
      proyecto: firstProspecto ? firstProspecto.nombreProyecto : '',
      tipoProyecto: 'Interno',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      area: 'Comercial',
      responsableTI: profesionales[0]?.nombre || '',
      estado: 'Solicitud',
      decisionComite: 'Pendiente',
      prioridad: 'Media',
      semaforo: 'Verde',
      etapa: 'Ingreso',
      fechaComite: '',
      planificacionEstimada: new Date().toISOString().split('T')[0],
      planificacionReal: '',
      fechaEstimadaEntrega: '',
      fechaEntregaReal: '',
      tiempoEstimadoCompleto: '',
      tiempoEstimadoAjuste: '',
      solicitante: firstProspecto ? (firstProspecto.cliente || '') : '',
      observaciones: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DemandaItem) => {
    setEditingItem(item);
    setFormData({ ...item, etapa: getStageFromItem(item) });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, proyecto: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro "${proyecto}"?`)) {
      try {
        await demandaService.delete(id);
        setDemandas(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('Error al eliminar demanda:', err);
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proyecto) {
      alert('Por favor ingrese el Nombre del Proyecto.');
      return;
    }

    try {
      setIsSaving(true);
      let itemSaved: DemandaItem;
      if (editingItem) {
        itemSaved = await demandaService.update(editingItem.id, formData);
        setDemandas(prev => prev.map(item => item.id === editingItem.id ? itemSaved : item));
      } else {
        itemSaved = await demandaService.create(formData);
        setDemandas(prev => [itemSaved, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al guardar demanda:', err);
      alert('Ocurrió un error al guardar los datos');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDemandas = useMemo(() => {
    return demandas.filter(item => {
      const matchSearch =
        (item.codigo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.proyecto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.solicitante || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.responsableTI || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.etapa || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchTipo = filterTipo === 'todos' || item.tipoProyecto === filterTipo;
      const matchArea = filterArea === 'todas' || item.area === filterArea;
      const matchEstado = filterEstado === 'todos' || item.estado === filterEstado;
      const matchDecision = filterDecisionComite === 'todos' || item.decisionComite === filterDecisionComite;
      const matchPrioridad = filterPrioridad === 'todas' || item.prioridad === filterPrioridad;

      return matchSearch && matchTipo && matchArea && matchEstado && matchDecision && matchPrioridad;
    });
  }, [demandas, searchQuery, filterTipo, filterArea, filterEstado, filterDecisionComite, filterPrioridad]);

  const stats = useMemo(() => {
    const total = demandas.length;
    const internos = demandas.filter(d => d.tipoProyecto === 'Interno').length;
    const externos = demandas.filter(d => d.tipoProyecto === 'Externo').length;
    const altaPrioridad = demandas.filter(d => (d.prioridad || '').toLowerCase() === 'alta').length;
    const enProceso = demandas.filter(d => d.estado === 'En Ejecución' || d.estado === 'Aprobado').length;
    const completados = demandas.filter(d => d.estado === 'Completado').length;

    return { total, internos, externos, altaPrioridad, enProceso, completados };
  }, [demandas]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[98%] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Volver al Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de la Demanda</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                    Control Consolidado
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={loadData}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Recargar datos"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 shadow-sm transition-all gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuevo Requerimiento</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[98%] mx-auto px-4 py-6">

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Total Solicitudes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Internos</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.internos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Externos</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.externos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Alta Prioridad</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.altaPrioridad}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">En Ejecución</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.enProceso}</p>
          </div>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completados}</p>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Filtros */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            <div className="relative lg:col-span-2">
              <input
                type="text"
                placeholder="Buscar por código, proyecto, área, TI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Tipo: Todos</option>
                <option value="Interno">Interno</option>
                <option value="Externo">Externo</option>
              </select>
            </div>

            <div>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Área: Todas</option>
                {AREAS_SOLICITANTES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Estado: Todos</option>
                {ESTADOS_DEMANDA.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterDecisionComite}
                onChange={(e) => setFilterDecisionComite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="todos">Decisión Comité: Todas</option>
                {DECISIONES_COMITE.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Prioridad: Todas</option>
                {PRIORIDADES_DEMANDA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Principal de Gestión de la Demanda (Orden Exacto Solicitado) */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando gestión de demandas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 text-red-600">
              <p>{error}</p>
              <button onClick={loadData} className="mt-2 text-xs font-semibold underline">Reintentar</button>
            </div>
          ) : filteredDemandas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                📋
              </div>
              <p className="text-gray-700 font-medium">No se encontraron registros de demanda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 min-w-[100px]">Código</th>
                    <th className="px-4 py-3 min-w-[200px]">Nombre Proyecto</th>
                    <th className="px-3 py-3 min-w-[130px]">Fecha Solicitud</th>
                    <th className="px-3 py-3 min-w-[160px]">Área Solicitante</th>
                    <th className="px-3 py-3 min-w-[170px]">Responsable TI</th>
                    <th className="px-3 py-3 min-w-[150px]">Estado</th>
                    <th className="px-3 py-3 min-w-[140px] text-purple-700 font-bold">Decisión Comité</th>
                    <th className="px-3 py-3 min-w-[110px]">Prioridad</th>
                    <th className="px-3 py-3 min-w-[110px]">Semáforo</th>
                    <th className="px-3 py-3 min-w-[170px]">Etapa</th>
                    <th className="px-3 py-3 min-w-[130px] text-purple-700 font-bold">Fecha Comité</th>
                    <th className="px-3 py-3 min-w-[140px]">PLANIF. (EST / REAL)</th>
                    <th className="px-3 py-3 min-w-[140px]">ENTREGA (EST / REAL)</th>
                    <th className="px-3 py-3 min-w-[150px]">Tiempo Est. Completo</th>
                    <th className="px-3 py-3 min-w-[140px]">Tiempo Est. Ajuste</th>
                    <th className="px-3 py-3 min-w-[160px]">Observación</th>
                    <th className="px-4 py-3 text-right sticky right-0 bg-slate-100 shadow-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredDemandas.map((item) => {
                    const isUpdatingThis = updatingId === item.id;
                    const isAprobado = item.estado === 'Aprobado';

                    return (
                      <tr key={item.id} className={`transition-colors ${isAprobado ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'hover:bg-slate-50/80'}`}>
                        
                        {/* 1. Código (Código oficial de Prospecto) */}
                        <td className="px-3 py-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {item.codigo && !item.codigo.startsWith('DEM-') 
                            ? item.codigo 
                            : (prospectos.find(p => p.nombreProyecto.trim().toLowerCase() === (item.proyecto || '').trim().toLowerCase())?.codigo || item.codigo || '-')}
                        </td>

                        {/* 2. Nombre Proyecto */}
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="font-semibold text-sm text-gray-900 leading-snug">
                            {item.proyecto}
                          </div>
                          <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-semibold uppercase ${
                            item.tipoProyecto === 'Interno' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.tipoProyecto || 'Interno'}
                          </span>
                        </td>

                        {/* 3. Fecha Solicitud */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={item.fechaSolicitud || ''}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { fechaSolicitud: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer"
                          />
                        </td>

                        {/* 4. Área Solicitante */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.area || 'Comercial'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { area: e.target.value })}
                            className="px-2 py-1 text-xs font-medium rounded-lg border border-gray-300 focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer max-w-[150px] truncate"
                          >
                            {AREAS_SOLICITANTES.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </td>

                        {/* 5. Responsable TI (Colaboradores Registrados) */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.responsableTI || ''}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { responsableTI: e.target.value })}
                            className="px-2 py-1 text-xs font-semibold text-gray-800 rounded-lg border border-indigo-200 focus:ring-1 focus:ring-indigo-500 bg-indigo-50/50 cursor-pointer max-w-[160px] truncate"
                          >
                            <option value="">- No asignado -</option>
                            {profesionales.map(p => (
                              <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                          </select>
                        </td>

                        {/* 6. Estado */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.estado || 'Solicitud'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { estado: e.target.value })}
                            className={`px-2.5 py-1 text-xs rounded-lg border focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${getEstadoBadgeClass(item.estado)}`}
                          >
                            {ESTADOS_DEMANDA.map(est => (
                              <option key={est} value={est} className="bg-white text-gray-800">{est}</option>
                            ))}
                          </select>
                        </td>

                        {/* 7. Decisión del Comité */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.decisionComite || 'Pendiente'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { decisionComite: e.target.value })}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs ${getDecisionComiteBadgeClass(item.decisionComite)}`}
                          >
                            {DECISIONES_COMITE.map(d => (
                              <option key={d.id} value={d.id} className="bg-white text-gray-800">{d.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* 8. Prioridad */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.prioridad || 'Media'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { prioridad: e.target.value })}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${getPrioridadBadgeClass(item.prioridad)}`}
                          >
                            {PRIORIDADES_DEMANDA.map(p => (
                              <option key={p} value={p} className="bg-white text-gray-800">{p}</option>
                            ))}
                          </select>
                        </td>

                        {/* 9. Semáforo */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={item.semaforo || 'Verde'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { semaforo: e.target.value })}
                            className={`px-2 py-1 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${getSemaforoBadgeClass(item.semaforo)}`}
                          >
                            {SEMAFOROS_DEMANDA.map(s => (
                              <option key={s.id} value={s.id} className="bg-white text-gray-800">{s.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* 10. Etapa */}
                        <td className="px-3 py-3 text-gray-700 min-w-[170px]">
                          {(() => {
                            const stage = getStageFromItem(item);
                            const stageIndex = ETAPAS_SEQUENTIAL.findIndex(s => s.id === stage);

                            return (
                              <div className="space-y-1">
                                <select
                                  value={stage}
                                  disabled={isUpdatingThis}
                                  onChange={(e) => handleQuickUpdateField(item.id, { etapa: e.target.value })}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border cursor-pointer focus:ring-1 focus:ring-indigo-500 shadow-2xs ${getEtapaBadgeClass(stage)}`}
                                >
                                  {ETAPAS_SEQUENTIAL.map(st => (
                                    <option key={st.id} value={st.id} className="bg-white text-gray-800">
                                      {st.icon} {st.fullLabel}
                                    </option>
                                  ))}
                                </select>

                                {/* Stepper 8 Pasos Mini */}
                                <div className="flex items-center gap-0.5 w-full max-w-[140px] pt-0.5">
                                  {ETAPAS_SEQUENTIAL.map((st, idx) => {
                                    const isCompleted = idx < stageIndex;
                                    const isCurrent = idx === stageIndex;
                                    return (
                                      <div 
                                        key={st.id} 
                                        className={`h-1.5 flex-1 rounded-full transition-all ${
                                          isCurrent ? 'bg-indigo-600 ring-1 ring-indigo-300 animate-pulse' :
                                          isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                                        }`}
                                        title={`Etapa: ${st.fullLabel}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 11. Fecha Comité */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={item.fechaComite || ''}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { fechaComite: e.target.value })}
                            className="px-2 py-1 text-xs border border-purple-300 rounded-md focus:ring-1 focus:ring-purple-500 bg-white font-medium cursor-pointer"
                          />
                        </td>

                        {/* 12. PLANIF. (EST / REAL) - Formato exacto solicitado */}
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                          <div><span className="text-gray-400 font-sans">Est:</span> {item.planificacionEstimada || '-'}</div>
                          <div><span className="text-gray-400 font-sans">Real:</span> {item.planificacionReal || '-'}</div>
                        </td>

                        {/* 13. ENTREGA (EST / REAL) - Formato exacto solicitado */}
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                          <div><span className="text-gray-400 font-sans">Est:</span> {item.fechaEstimadaEntrega || '-'}</div>
                          <div><span className="text-gray-400 font-sans">Real:</span> {item.fechaEntregaReal || '-'}</div>
                        </td>

                        {/* 14. Tiempo Estimado Completo */}
                        <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.tiempoEstimadoCompleto || calculateTiempoEstimadoAuto(item)}
                            placeholder="Ej: 15 días"
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { tiempoEstimadoCompleto: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white max-w-[130px]"
                          />
                        </td>

                        {/* 15. Tiempo Estimado Ajuste */}
                        <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.tiempoEstimadoAjuste || ''}
                            placeholder="Ej: +3 días"
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickUpdateField(item.id, { tiempoEstimadoAjuste: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white max-w-[120px]"
                          />
                        </td>

                        {/* 16. Observación (Sin texto por defecto) */}
                        <td className="px-3 py-3 text-gray-700">
                          {(() => {
                            const obs = item.observaciones || '';
                            const isAutoText = obs.includes('Actualizado desde Prospect') || 
                                               obs.includes('Sincronizado') || 
                                               obs.includes('Ficha creada') || 
                                               obs.includes('Traspasado desde');
                            const cleanObs = isAutoText ? '' : obs;
                            return cleanObs ? (
                              <span className="truncate max-w-[160px] block text-xs" title={cleanObs}>
                                {cleanObs}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-normal">-</span>
                            );
                          })()}
                        </td>

                        {/* 17. Acciones */}
                        <td className="px-4 py-3 text-right whitespace-nowrap sticky right-0 bg-white shadow-xs">
                          <div className="flex items-center justify-end space-x-1.5">
                            {isAprobado && (
                              <button
                                onClick={() => handleConvertToFicha(item)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                                title="Traspasar datos a Ficha de Proyecto"
                              >
                                🚀 Ficha
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Editar Requerimiento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleDelete(item.id, item.proyecto)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear / Editar Requerimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingItem ? 'Editar Requerimiento de Demanda' : 'Nuevo Requerimiento de Demanda'}
                </h3>
                <p className="text-xs text-indigo-100">
                  Formulario completo de recepción y seguimiento
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario Modal */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Vincular Ficha Prospecto (Auto-completar Código y Proyecto) */}
                {prospectos.length > 0 && (
                  <div className="lg:col-span-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                      <span>📋</span>
                      <span>Seleccionar Ficha Prospecto (Sincroniza Código y Nombre de Proyecto)</span>
                    </label>
                    <select
                      value={prospectos.find(p => p.codigo === formData.codigo)?.id || ''}
                      onChange={(e) => {
                        const selected = prospectos.find(p => p.id === e.target.value);
                        if (selected) {
                          setFormData(prev => ({
                            ...prev,
                            codigo: selected.codigo,
                            proyecto: selected.nombreProyecto,
                            solicitante: prev.solicitante || selected.cliente || ''
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">- Seleccionar desde Fichas Prospecto -</option>
                      {prospectos.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.codigo}] {p.nombreProyecto} {p.cliente ? `(${p.cliente})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 1. Código (Igual al de Ficha Prospecto) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Código Proyecto (Prospecto) <span className="text-indigo-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.codigo || ''}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: PR-2026-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 2. Nombre del Proyecto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del Proyecto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.proyecto || ''}
                    onChange={(e) => setFormData({ ...formData, proyecto: e.target.value })}
                    placeholder="Ej: Implementación Portal Clientes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tipo de Proyecto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Proyecto</label>
                  <select
                    value={formData.tipoProyecto || 'Interno'}
                    onChange={(e) => setFormData({ ...formData, tipoProyecto: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Interno">Interno (Corporativo)</option>
                    <option value="Externo">Externo (Cliente / Terceros)</option>
                  </select>
                </div>

                {/* 3. Fecha Solicitud */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Solicitud</label>
                  <input
                    type="date"
                    value={formData.fechaSolicitud || ''}
                    onChange={(e) => setFormData({ ...formData, fechaSolicitud: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 4. Área Solicitante */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Área Solicitante</label>
                  <select
                    value={formData.area || 'Comercial'}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {AREAS_SOLICITANTES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Responsable TI (Colaboradores Registrados) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Responsable TI (Colaboradores)</label>
                  <select
                    value={formData.responsableTI || ''}
                    onChange={(e) => setFormData({ ...formData, responsableTI: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">- Seleccionar Colaborador -</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Estado */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select
                    value={formData.estado || 'Solicitud'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {ESTADOS_DEMANDA.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>

                {/* 7. Decisión del Comité */}
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1">Decisión del Comité</label>
                  <select
                    value={formData.decisionComite || 'Pendiente'}
                    onChange={(e) => setFormData({ ...formData, decisionComite: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    {DECISIONES_COMITE.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* 8. Prioridad */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={formData.prioridad || 'Media'}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {PRIORIDADES_DEMANDA.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* 9. Semáforo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semáforo</label>
                  <select
                    value={formData.semaforo || 'Verde'}
                    onChange={(e) => setFormData({ ...formData, semaforo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {SEMAFOROS_DEMANDA.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* 11. Fecha Comité */}
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1">Fecha Comité</label>
                  <input
                    type="date"
                    value={formData.fechaComite || ''}
                    onChange={(e) => setFormData({ ...formData, fechaComite: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                {/* 10. Etapa Stepper */}
                <div className="lg:col-span-3">
                  <ProjectLifecycleStepper
                    currentStage={formData.etapa || 'Ingreso'}
                    onStageChange={(stage) => setFormData({ ...formData, etapa: stage })}
                  />
                </div>

                {/* 12. Planificación (Estimada / Real) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planificación Estimada (Inicio)</label>
                  <input
                    type="date"
                    value={formData.planificacionEstimada || ''}
                    onChange={(e) => setFormData({ ...formData, planificacionEstimada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planificación Real (Inicio)</label>
                  <input
                    type="date"
                    value={formData.planificacionReal || ''}
                    onChange={(e) => setFormData({ ...formData, planificacionReal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 13. Entrega (Estimada / Real) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Estimada Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEstimadaEntrega || ''}
                    onChange={(e) => setFormData({ ...formData, fechaEstimadaEntrega: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Real Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEntregaReal || ''}
                    onChange={(e) => setFormData({ ...formData, fechaEntregaReal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 14. Tiempo Estimado Completo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tiempo Estimado Completo</label>
                  <input
                    type="text"
                    value={formData.tiempoEstimadoCompleto || ''}
                    onChange={(e) => setFormData({ ...formData, tiempoEstimadoCompleto: e.target.value })}
                    placeholder="Ej: 15 días, 2 meses"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 15. Tiempo Estimado Ajuste */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tiempo Estimado Ajuste</label>
                  <input
                    type="text"
                    value={formData.tiempoEstimadoAjuste || ''}
                    onChange={(e) => setFormData({ ...formData, tiempoEstimadoAjuste: e.target.value })}
                    placeholder="Ej: +3 días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Solicitante Persona */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Solicitante Persona</label>
                  <input
                    type="text"
                    value={formData.solicitante || ''}
                    onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    placeholder="Nombre del solicitante"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 16. Observaciones (Totalmente en blanco por defecto) */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones / Detalles</label>
                  <textarea
                    rows={3}
                    value={formData.observaciones || ''}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Escriba observaciones o detalles si lo requiere..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>

              {/* Botones del Modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Guardar Cambios' : 'Crear Registro'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDemanda;
