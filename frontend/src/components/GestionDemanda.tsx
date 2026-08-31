import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemandaItem, PrioridadDemanda, EstadoDemanda, TipoProyectoDemanda } from '../types/demanda';
import demandaService from '../services/demandaService';

const ESTADOS_DEMANDA: EstadoDemanda[] = [
  'backlog',
  'solicitado',
  'ejecución aprobada',
  'en proceso',
  'en espera cierre del usuario',
  'finalizado'
];

const PRIORIDADES_DEMANDA: PrioridadDemanda[] = ['alta', 'media', 'baja'];

// Helper para determinar la etapa individual de cada proyecto
const getStageFromItem = (item: Partial<DemandaItem>): string => {
  if (item.etapa && ['Prospecto', 'Ficha', 'Solicitud', 'Aprobado', 'Rechazado'].includes(item.etapa)) {
    return item.etapa;
  }
  // Si la ejecución fue aprobada en Prospecto pero aún no tiene resolución final, pasa a etapa 'Ficha' (Etapa 2)
  if (item.estado === 'ejecución aprobada') {
    return 'Ficha';
  }
  if (item.estado === 'finalizado') {
    return 'Aprobado';
  }
  return 'Prospecto';
};

// Componente de Trazabilidad / Stepper del Ciclo de Vida del Proyecto ("Pedido viajando")
const ProjectLifecycleStepper: React.FC<{
  currentStage: string;
  onStageChange: (stage: string) => void;
}> = ({ currentStage, onStageChange }) => {
  const stages = [
    { id: 'Prospecto', label: '1. Prospecto', sublabel: 'Comercial', icon: '💼' },
    { id: 'Ficha', label: '2. Ficha', sublabel: 'Proyecto', icon: '📄' },
    { id: 'Solicitud', label: '3. Solicitud', sublabel: 'Formulario', icon: '📋' },
    { id: 'Aprobado', label: '4. Resolución', sublabel: 'Final', icon: '🏁' },
  ];

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case 'Prospecto': return 0;
      case 'Ficha': return 1;
      case 'Solicitud': return 2;
      case 'Aprobado': return 3;
      case 'Rechazado': return 3;
      default: return 1;
    }
  };

  const currentIndex = getStageIndex(currentStage);
  const isRechazado = currentStage === 'Rechazado';

  return (
    <div className="bg-gradient-to-r from-slate-50 via-indigo-50/60 to-purple-50 p-3.5 rounded-xl border border-indigo-100 shadow-xs my-3 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">📦</span>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Etapa del Proyecto (Trazabilidad)
          </span>
        </div>
        <span className={`px-2 py-0.5 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-xs ${
          isRechazado ? 'bg-red-100 text-red-700 border border-red-200' :
          currentStage === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
          'bg-indigo-100 text-indigo-800 border border-indigo-200'
        }`}>
          {isRechazado ? '❌ Rechazado' :
           currentStage === 'Aprobado' ? '✅ Aprobado' :
           currentStage === 'Solicitud' ? '📋 En Solicitud' :
           currentStage === 'Prospecto' ? '💼 Prospecto' : '📄 Ficha Creada'}
        </span>
      </div>

      {/* Bar & Steps ("Pedido viajando") */}
      <div className="relative my-3 px-2">
        {/* Connecting Line */}
        <div className="absolute top-3.5 left-6 right-6 h-1 bg-gray-200 rounded -z-0">
          <div 
            className={`h-1 transition-all duration-500 rounded ${isRechazado ? 'bg-red-500' : 'bg-indigo-600'}`}
            style={{ width: `${(currentIndex / 3) * 100}%` }}
          />
        </div>

        {/* Steps Nodes */}
        <div className="flex justify-between items-center relative z-10">
          {stages.map((st, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div 
                key={st.id} 
                onClick={() => onStageChange(st.id)}
                className="flex flex-col items-center cursor-pointer group"
                title={`Cambiar a etapa: ${st.label}`}
              >
                {/* Active Moving Marker ("Proyecto aquí") */}
                <div className="h-5 flex items-center justify-center mb-0.5">
                  {isCurrent && (
                    <div className="animate-bounce flex items-center gap-0.5 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-md font-bold">
                      <span>🚀</span>
                      <span>Proyecto</span>
                    </div>
                  )}
                </div>

                {/* Node Circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 transform group-hover:scale-110 shadow-xs ${
                  isCurrent ? (isRechazado ? 'bg-red-600 text-white ring-4 ring-red-100 scale-110' : 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110') :
                  isCompleted ? 'bg-emerald-500 text-white' :
                  'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : st.icon}
                </div>

                {/* Step Labels */}
                <div className="text-center mt-1">
                  <span className={`block text-[10px] font-bold leading-tight ${
                    isCurrent ? 'text-indigo-900 font-extrabold' :
                    isCompleted ? 'text-emerald-700' : 'text-gray-400'
                  }`}>
                    {st.label}
                  </span>
                  <span className="block text-[9px] text-gray-500 leading-none mt-0.5">
                    {st.sublabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Selector Options / Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1 mt-3 pt-2 border-t border-indigo-100/60">
        <span className="text-[10px] text-gray-500 font-semibold">Seleccionar etapa:</span>
        <div className="flex gap-1">
          {stages.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => onStageChange(st.id)}
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                currentStage === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              {st.icon} {st.id}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onStageChange('Rechazado')}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
              currentStage === 'Rechazado'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
            }`}
          >
            ❌ Rechazado
          </button>
        </div>
      </div>
    </div>
  );
};

const GestionDemanda: React.FC = () => {
  const navigate = useNavigate();
  const [demandas, setDemandas] = useState<DemandaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todas');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Modales y formularios
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DemandaItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<DemandaItem>>({
    proyecto: '',
    tipoProyecto: 'Interno',
    prioridad: 'media',
    estado: 'solicitado',
    etapa: 'Levantamiento',
    area: '',
    planificacionEstimada: new Date().toISOString().split('T')[0],
    planificacionReal: '',
    fechaEstimadaEntrega: '',
    fechaEntregaReal: '',
    responsableTI: '',
    solicitante: '',
    observaciones: ''
  });

  // Cargar datos al iniciar
  const loadDemandas = async () => {
    try {
      setLoading(true);
      setError(null);
      await demandaService.syncAllProspectosToDemanda();
      const data = await demandaService.getAll();
      setDemandas(data);
    } catch (err: any) {
      console.error('Error cargando gestión de demanda:', err);
      setError('Error al cargar los registros de demanda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandas();
  }, []);

  // Manejar cambio rápido de Prioridad desde la lista
  const handleQuickPrioridadChange = async (id: string, newPrioridad: PrioridadDemanda) => {
    try {
      setUpdatingId(id);
      const updated = await demandaService.updatePrioridad(id, newPrioridad);
      setDemandas(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Error actualizando prioridad rápida:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Conversión/Pasaje a Ficha de Proyecto (Manual al presionar el botón)
  const handleConvertToFicha = async (item: DemandaItem) => {
    try {
      // Actualizar la etapa a 'Ficha' para reflejar que pasó a Ficha de Proyecto
      const updated = await demandaService.update(item.id, { etapa: 'Ficha' });
      setDemandas(prev => prev.map(d => d.id === item.id ? updated : d));
      navigate('/fichas-proyecto', { state: { convertFromDemanda: updated } });
    } catch (e) {
      console.warn('Error al actualizar etapa a Ficha:', e);
      navigate('/fichas-proyecto', { state: { convertFromDemanda: item } });
    }
  };

  // Manejar cambio rápido de Estado desde la lista
  const handleQuickEstadoChange = async (id: string, newEstado: EstadoDemanda) => {
    try {
      setUpdatingId(id);
      const updated = await demandaService.updateEstado(id, newEstado);
      setDemandas(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Error actualizando estado rápido:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Manejar cambio rápido de Etapa desde la lista
  const handleQuickEtapaChange = async (id: string, newEtapa: string) => {
    try {
      setUpdatingId(id);
      const updated = await demandaService.update(id, { etapa: newEtapa });
      setDemandas(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Error actualizando etapa rápida:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir Modal para crear
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      proyecto: '',
      tipoProyecto: 'Interno',
      prioridad: 'media',
      estado: 'solicitado',
      etapa: 'Ficha',
      area: '',
      planificacionEstimada: new Date().toISOString().split('T')[0],
      planificacionReal: '',
      fechaEstimadaEntrega: '',
      fechaEntregaReal: '',
      responsableTI: '',
      solicitante: '',
      observaciones: ''
    });
    setIsModalOpen(true);
  };

  // Abrir Modal para editar
  const handleOpenEditModal = (item: DemandaItem) => {
    setEditingItem(item);
    const itemStage = getStageFromItem(item);
    setFormData({ ...item, etapa: itemStage });
    setIsModalOpen(true);
  };

  // Eliminar demanda
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

  // Guardar formulario (Crear o Editar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proyecto || !formData.solicitante) {
      alert('Por favor complete los campos obligatorios: Proyecto y Solicitante.');
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

  // Calcular Variación de Días entre Fecha Estimada de Entrega y Fecha Real (o fecha actual)
  const calculateVariacion = (fechaEstimada?: string, fechaReal?: string): { dias: number | null, texto: string, colorClass: string } => {
    if (!fechaEstimada) {
      return { dias: null, texto: 'Sin fecha', colorClass: 'bg-gray-100 text-gray-600' };
    }

    const est = new Date(fechaEstimada);
    const refDate = fechaReal ? new Date(fechaReal) : new Date();

    // Eliminar hora
    est.setHours(0, 0, 0, 0);
    refDate.setHours(0, 0, 0, 0);

    const diffTime = refDate.getTime() - est.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { dias: 0, texto: 'A tiempo', colorClass: 'bg-green-100 text-green-800 font-semibold' };
    } else if (diffDays < 0) {
      return { dias: diffDays, texto: `${Math.abs(diffDays)}d anticipado`, colorClass: 'bg-emerald-100 text-emerald-800 font-semibold' };
    } else {
      return { dias: diffDays, texto: `+${diffDays}d atraso`, colorClass: 'bg-red-100 text-red-800 font-semibold' };
    }
  };

  // Lista filtrada
  const filteredDemandas = useMemo(() => {
    return demandas.filter(item => {
      const matchSearch =
        item.proyecto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.solicitante.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.responsableTI.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.etapa.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTipo = filterTipo === 'todos' || item.tipoProyecto === filterTipo;
      const matchPrioridad = filterPrioridad === 'todas' || item.prioridad === filterPrioridad;
      const matchEstado = filterEstado === 'todos' || item.estado === filterEstado;

      return matchSearch && matchTipo && matchPrioridad && matchEstado;
    });
  }, [demandas, searchQuery, filterTipo, filterPrioridad, filterEstado]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = demandas.length;
    const internos = demandas.filter(d => d.tipoProyecto === 'Interno').length;
    const externos = demandas.filter(d => d.tipoProyecto === 'Externo').length;
    const altaPrioridad = demandas.filter(d => d.prioridad === 'alta').length;
    const enProceso = demandas.filter(d => d.estado === 'en proceso' || d.estado === 'ejecución aprobada').length;
    const finalizados = demandas.filter(d => d.estado === 'finalizado').length;

    return { total, internos, externos, altaPrioridad, enProceso, finalizados };
  }, [demandas]);

  // Clases de estilo para prioridades
  const getPrioridadBadgeClass = (p: PrioridadDemanda) => {
    switch (p) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'media': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'baja': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Clases de estilo para estados
  const getEstadoBadgeClass = (e: EstadoDemanda) => {
    switch (e) {
      case 'backlog': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'solicitado': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'ejecución aprobada': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'en proceso': return 'bg-blue-100 text-blue-800 border-blue-200 font-semibold';
      case 'en espera cierre del usuario': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'finalizado': return 'bg-green-100 text-green-800 border-green-200 font-semibold';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                    Internos y Externos
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Control y recepción de proyectos, asignación TI y seguimiento de fechas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={loadDemandas}
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
                <span>Nueva Demanda</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Total Solicitudes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            <span className="text-[11px] text-gray-400">Demanda consolidada</span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Proyectos Internos</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.internos}</p>
            <span className="text-[11px] text-indigo-500 font-medium">Uso corporativo</span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Proyectos Externos</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.externos}</p>
            <span className="text-[11px] text-purple-500 font-medium">Clientes / Terceros</span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Alta Prioridad</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.altaPrioridad}</p>
            <span className="text-[11px] text-red-500 font-medium">Atención prioritaria</span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.enProceso}</p>
            <span className="text-[11px] text-blue-500 font-medium">En ejecución active</span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">Finalizados</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.finalizados}</p>
            <span className="text-[11px] text-green-500 font-medium">Completados</span>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Filtros */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buscador */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por proyecto, solicitante, TI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filtro Tipo Proyecto */}
            <div>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Tipo: Todos (Internos y Externos)</option>
                <option value="Interno">Internos únicamente</option>
                <option value="Externo">Externos únicamente</option>
              </select>
            </div>

            {/* Filtro Prioridad */}
            <div>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Prioridad: Todas</option>
                {PRIORIDADES_DEMANDA.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Estado: Todos</option>
                {ESTADOS_DEMANDA.map(est => (
                  <option key={est} value={est}>{est.charAt(0).toUpperCase() + est.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Principal */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando gestión de demandas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 text-red-600">
              <p>{error}</p>
              <button onClick={loadDemandas} className="mt-2 text-xs font-semibold underline">Reintentar</button>
            </div>
          ) : filteredDemandas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                📋
              </div>
              <p className="text-gray-700 font-medium">No se encontraron registros de demanda</p>
              <p className="text-gray-500 text-xs mt-1">Prueba ajustando los filtros de búsqueda o agrega una nueva demanda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-slate-100 text-gray-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 min-w-[200px]">Proyecto & Tipo</th>
                    <th className="px-3 py-3 min-w-[130px]">Prioridad (Editable)</th>
                    <th className="px-3 py-3 min-w-[180px]">Estado (Editable)</th>
                    <th className="px-3 py-3">Etapa</th>
                    <th className="px-3 py-3">Área</th>
                    <th className="px-3 py-3">Planif. (Est / Real)</th>
                    <th className="px-3 py-3">Entrega (Est / Real)</th>
                    <th className="px-3 py-3 text-center">Variación Entrega</th>
                    <th className="px-3 py-3">Responsable TI</th>
                    <th className="px-3 py-3">Solicitante</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredDemandas.map((item) => {
                    const variacion = calculateVariacion(item.fechaEstimadaEntrega, item.fechaEntregaReal);
                    const isUpdatingThis = updatingId === item.id;
                    const isAprobado = item.estado === 'ejecución aprobada';

                    return (
                      <tr key={item.id} className={`transition-colors ${isAprobado ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50/80'}`}>
                        {/* Proyecto & Tipo */}
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="font-semibold text-sm text-gray-900 leading-snug flex items-center gap-2">
                            <span>{item.proyecto}</span>
                            {isAprobado && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded shadow-xs">
                                🟢 Aprobado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              item.tipoProyecto === 'Interno' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.tipoProyecto}
                            </span>
                            {item.observaciones && (
                              <span className="text-gray-400 text-[11px] truncate max-w-[150px]" title={item.observaciones}>
                                📝 {item.observaciones}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Prioridad con SELECTOR RÁPIDO DIRECTO EN LA LISTA */}
                        <td className="px-3 py-3">
                          <div className="relative">
                            <select
                              value={item.prioridad}
                              disabled={isUpdatingThis}
                              onChange={(e) => handleQuickPrioridadChange(item.id, e.target.value as PrioridadDemanda)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs ${getPrioridadBadgeClass(item.prioridad)}`}
                            >
                              <option value="alta" className="bg-white text-red-700">🔴 Alta</option>
                              <option value="media" className="bg-white text-amber-800">🟡 Media</option>
                              <option value="baja" className="bg-white text-blue-700">🔵 Baja</option>
                            </select>
                          </div>
                        </td>

                        {/* Estado con SELECTOR RÁPIDO DIRECTO EN LA LISTA */}
                        <td className="px-3 py-3">
                          <div className="relative">
                            <select
                              value={item.estado}
                              disabled={isUpdatingThis}
                              onChange={(e) => handleQuickEstadoChange(item.id, e.target.value as EstadoDemanda)}
                              className={`px-2.5 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs ${getEstadoBadgeClass(item.estado)}`}
                            >
                              <option value="backlog" className="bg-white text-slate-700">Backlog</option>
                              <option value="solicitado" className="bg-white text-sky-800">Solicitado</option>
                              <option value="ejecución aprobada" className="bg-emerald-600 text-white font-bold">🟢 Ejecución Aprobada</option>
                              <option value="en proceso" className="bg-white text-blue-800">En Proceso</option>
                              <option value="en espera cierre del usuario" className="bg-white text-amber-800">En Espera Cierre Usuario</option>
                              <option value="finalizado" className="bg-white text-green-800">Finalizado</option>
                            </select>
                          </div>
                        </td>

                        {/* Etapa (Trazabilidad con seguidor visual) */}
                        <td className="px-3 py-3 text-gray-700 min-w-[165px]">
                          {(() => {
                            const stage = getStageFromItem(item);
                            const stages = [
                              { id: 'Prospecto', label: 'Prospecto', icon: '💼' },
                              { id: 'Ficha', label: 'Ficha', icon: '📄' },
                              { id: 'Solicitud', label: 'Solicitud', icon: '📋' },
                              { id: 'Aprobado', label: 'Aprobado', icon: '✅' },
                            ];
                            const stageIndex = stage === 'Prospecto' ? 0 : stage === 'Solicitud' ? 2 : (stage === 'Aprobado' || stage === 'Rechazado') ? 3 : 1;
                            const isRechazado = stage === 'Rechazado';

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <select
                                    value={stage}
                                    disabled={isUpdatingThis}
                                    onChange={(e) => handleQuickEtapaChange(item.id, e.target.value)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs ${
                                      isRechazado ? 'bg-red-100 text-red-700 border-red-200' :
                                      stage === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                      stage === 'Solicitud' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                      stage === 'Prospecto' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                      'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}
                                  >
                                    <option value="Prospecto">💼 1. Prospecto</option>
                                    <option value="Ficha">📄 2. Ficha</option>
                                    <option value="Solicitud">📋 3. Solicitud</option>
                                    <option value="Aprobado">✅ 4. Aprobado</option>
                                    <option value="Rechazado">❌ 4. Rechazado</option>
                                  </select>
                                </div>

                                {/* Barra de avance de 4 pasos */}
                                <div className="flex items-center gap-1 w-full max-w-[130px] pt-0.5" title={`Etapa actual: ${stage}`}>
                                  {stages.map((st, idx) => {
                                    const isCompleted = idx < stageIndex;
                                    const isCurrent = idx === stageIndex;
                                    return (
                                      <div 
                                        key={st.id} 
                                        className={`h-1.5 flex-1 rounded-full transition-all ${
                                          isCurrent ? (isRechazado ? 'bg-red-500 ring-2 ring-red-200 animate-pulse' : 'bg-indigo-600 ring-2 ring-indigo-200 animate-pulse') :
                                          isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                                        }`}
                                        title={`Etapa: ${st.label}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Área */}
                        <td className="px-3 py-3 text-gray-700 font-medium">
                          {item.area || 'General'}
                        </td>

                        {/* Planificación (Estimada / Real) */}
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          <div><span className="text-gray-400">Est:</span> {item.planificacionEstimada || '-'}</div>
                          <div><span className="text-gray-400">Real:</span> {item.planificacionReal || '-'}</div>
                        </td>

                        {/* Entrega (Estimada / Real) */}
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          <div><span className="text-gray-400">Est:</span> {item.fechaEstimadaEntrega || '-'}</div>
                          <div><span className="text-gray-400">Real:</span> {item.fechaEntregaReal || '-'}</div>
                        </td>

                        {/* Variación Fecha Entrega */}
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] ${variacion.colorClass}`}>
                            {variacion.texto}
                          </span>
                        </td>

                        {/* Responsable TI */}
                        <td className="px-3 py-3 text-gray-800 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                              TI
                            </span>
                            <span>{item.responsableTI || 'No asignado'}</span>
                          </div>
                        </td>

                        {/* Solicitante */}
                        <td className="px-3 py-3 text-gray-700">
                          {item.solicitante}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {isAprobado && (
                              <button
                                onClick={() => handleConvertToFicha(item)}
                                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                title="Traspasar datos a Ficha de Proyecto"
                              >
                                🚀 Pasar a Ficha
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Editar Ficha Completa"
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

      {/* Modal Crear/Editar Demanda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingItem ? 'Editar Ficha de Demanda' : 'Nueva Ficha de Demanda'}
                </h3>
                <p className="text-xs text-indigo-100">
                  {editingItem ? 'Actualiza los parámetros del requerimiento' : 'Ingresa los datos para recepcionar la demanda'}
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

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Proyecto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del Proyecto / Requerimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.proyecto || ''}
                    onChange={(e) => setFormData({ ...formData, proyecto: e.target.value })}
                    placeholder="Ej: PROY-005 Implementación Servidor Cloud"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tipo Proyecto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Proyecto</label>
                  <select
                    value={formData.tipoProyecto || 'Interno'}
                    onChange={(e) => setFormData({ ...formData, tipoProyecto: e.target.value as TipoProyectoDemanda })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Interno">Interno (Corporativo)</option>
                    <option value="Externo">Externo (Cliente / Terceros)</option>
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={formData.prioridad || 'media'}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as PrioridadDemanda })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Media</option>
                    <option value="baja">🔵 Baja</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado actual</label>
                  <select
                    value={formData.estado || 'solicitado'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoDemanda })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {ESTADOS_DEMANDA.map(est => (
                      <option key={est} value={est}>{est.charAt(0).toUpperCase() + est.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* ✅ NUEVO: Seguidor Visual de Etapa del Proyecto / Trazabilidad ("Pedido viajando") */}
                <ProjectLifecycleStepper
                  currentStage={formData.etapa || 'Ficha'}
                  onStageChange={(stage) => setFormData({ ...formData, etapa: stage })}
                />

                {/* Área */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Área Solicitante</label>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Ej: Finanzas, Operaciones, Comercial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Solicitante */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Persona Solicitante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.solicitante || ''}
                    onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    placeholder="Nombre del solicitante"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Responsable TI */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Responsable TI Asignado</label>
                  <input
                    type="text"
                    value={formData.responsableTI || ''}
                    onChange={(e) => setFormData({ ...formData, responsableTI: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Planificación Estimada */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planificación Estimada (Inicio)</label>
                  <input
                    type="date"
                    value={formData.planificacionEstimada || ''}
                    onChange={(e) => setFormData({ ...formData, planificacionEstimada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Planificación Real */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planificación Real (Inicio)</label>
                  <input
                    type="date"
                    value={formData.planificacionReal || ''}
                    onChange={(e) => setFormData({ ...formData, planificacionReal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Fecha Estimada Entrega */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEstimadaEntrega || ''}
                    onChange={(e) => setFormData({ ...formData, fechaEstimadaEntrega: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Fecha Entrega Real */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Real de Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEntregaReal || ''}
                    onChange={(e) => setFormData({ ...formData, fechaEntregaReal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones o Descripción</label>
                  <textarea
                    rows={3}
                    value={formData.observaciones || ''}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Detalles adicionales del requerimiento..."
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
