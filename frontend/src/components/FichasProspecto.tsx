import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { showSuccess, showError, showWarning } from './Toast';

interface FichaProspecto {
  id: string;
  codigo: string;
  nombreProyecto: string;
  estado: string;
  cliente: string;
  gestorComercial?: string;
  centroCosto?: string;
  fechaEstimadaAdjudicacion?: string;
  fechaAdjudicacion?: string;
  valorServicio?: number;
  margen?: number;
  rentabilidad?: number;
  plazoEstimado?: string;
  lineaServicio?: string;
  fechaInicio?: string;
  fechaTermino?: string;
  garantia?: string;
  horasSoporte?: number;
  totalIngresos?: number;
  tipoCliente?: string;
  estimaciones?: {
    mensual?: { [key: string]: number };
    semanal?: { [key: string]: number };
    anual?: { [key: string]: number };
  };
}

const estadosDisponibles = [
  '0% Abordada o Cancelada',
  '0% Congelado',
  '0% Perdida',
  '10% Prospecto (Lead)',
  '20% Calificación',
  '30% En elaboración',
  '60% Enviada',
  '70% Negociación',
  '90% Asignada',
  '100% Aceptada por cliente'
];

const getPercentageFromEstado = (estado: string): number => {
  const match = estado.match(/^(\d+)%/);
  return match ? Number(match[1]) : 0;
};

const getDiasDelMes = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const dates: Date[] = [];
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const getDiasDeLaSemana = (currentDate: Date): Date[] => {
  const current = new Date(currentDate);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
  const monday = new Date(current.setDate(diff));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const isProspectoActivoEnFecha = (p: FichaProspecto, date: Date): boolean => {
  const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  
  if (p.fechaInicio && p.fechaTermino) {
    const fInicio = new Date(p.fechaInicio);
    const fTermino = new Date(p.fechaTermino);
    const start = new Date(fInicio.getFullYear(), fInicio.getMonth(), fInicio.getDate()).getTime();
    const end = new Date(fTermino.getFullYear(), fTermino.getMonth(), fTermino.getDate()).getTime();
    if (targetTime >= start && targetTime <= end) {
      return true;
    }
  }
  
  if (p.fechaEstimadaAdjudicacion) {
    const fAdj = new Date(p.fechaEstimadaAdjudicacion);
    const adjTime = new Date(fAdj.getFullYear(), fAdj.getMonth(), fAdj.getDate()).getTime();
    if (targetTime === adjTime) {
      return true;
    }
  }

  return false;
};

const getEstadoColor = (estado: string): string => {
  const pct = getPercentageFromEstado(estado);
  if (pct === 100) return 'bg-green-500 text-white';
  if (pct >= 60) return 'bg-blue-500 text-white';
  if (pct >= 10) return 'bg-indigo-500 text-white';
  return 'bg-gray-400 text-white';
};

const generateVigenteCode = (nombre: string, existingProspectos: FichaProspecto[], currentId?: string | null): string => {
  if (!nombre) return 'proj_01';
  const clean = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  const prefix = clean.substring(0, 4);
  
  if (!prefix) return 'proj_01';

  const matchingCodes = existingProspectos
    .filter(p => p.id !== currentId && p.codigo && p.codigo.toLowerCase().startsWith(`${prefix}_`))
    .map(p => {
      const parts = p.codigo.split('_');
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? 0 : num;
    });

  let nextNum = 1;
  if (matchingCodes.length > 0) {
    nextNum = Math.max(...matchingCodes) + 1;
  }
  
  const numStr = nextNum.toString().padStart(2, '0');
  return `${prefix}_${numStr}`;
};

interface FichasProspectoProps {
  onConvertToProject?: (p: FichaProspecto) => void;
}

const FichasProspecto: React.FC<FichasProspectoProps> = ({ onConvertToProject }) => {
  const [prospectos, setProspectos] = useState<FichaProspecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState('todos');

  // Sub-tabs: 'lista' | 'calendario'
  const [subTab, setSubTab] = useState<'lista' | 'calendario'>('lista');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Quick Status Modal State
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [quickStatusProspecto, setQuickStatusProspecto] = useState<FichaProspecto | null>(null);
  const [newQuickStatus, setNewQuickStatus] = useState('');



  // Main Calendar view states
  const [fechaCalCentral, setFechaCalCentral] = useState<Date>(new Date());
  const [calCentralView, setCalCentralView] = useState<'mensual' | 'semanal' | 'anual'>('mensual');



  // Form State
  const defaultFormData = {
    codigo: '',
    nombreProyecto: '',
    estado: '10% Prospecto (Lead)',
    cliente: '',
    gestorComercial: '',
    centroCosto: '',
    fechaEstimadaAdjudicacion: '',
    fechaAdjudicacion: '',
    valorServicio: 0,
    margen: 0,
    rentabilidad: 0,
    plazoEstimado: '',
    lineaServicio: '',
    fechaInicio: '',
    fechaTermino: '',
    garantia: '',
    horasSoporte: 0,
    totalIngresos: 0,
    tipoCliente: 'Nuevo',
    estimaciones: {
      mensual: {} as { [key: string]: number },
      semanal: {} as { [key: string]: number },
      anual: {} as { [key: string]: number }
    }
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Custom Delete Confirm Modal State
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Softland Clients and Salespeople Autocomplete States
  const [clientesOriginales, setClientesOriginales] = useState<any[]>([]);
  const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  
  const [vendedoresOriginales, setVendedoresOriginales] = useState<any[]>([]);
  const [vendedoresSugeridos, setVendedoresSugeridos] = useState<any[]>([]);
  const [showVendedoresDropdown, setShowVendedoresDropdown] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowClientesDropdown(false);
      setShowVendedoresDropdown(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadClientes = async () => {
    try {
      setLoadingClientes(true);
      const res = await api.get('/softland/clientes');
      if (res.data.success) {
        setClientesOriginales(res.data.data);
        setClientesSugeridos(res.data.data.slice(0, 50));
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  const loadVendedores = async () => {
    try {
      const res = await api.get('/softland/vendedores');
      if (res.data.success) {
        setVendedoresOriginales(res.data.data);
        setVendedoresSugeridos(res.data.data.slice(0, 50));
      }
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    }
  };

  const handleSelectCliente = (c: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        cliente: c.NomAux
      };
      if (c.VenDes) {
        updated.gestorComercial = c.VenDes;
      }
      return updated;
    });
    setShowClientesDropdown(false);
  };

  // Load prospectos
  const loadProspectos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fichas-prospecto');
      if (response.data.success) {
        setProspectos(response.data.data);
      } else {
        setError('No se pudieron cargar los prospectos');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error de servidor al cargar prospectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspectos();
    loadVendedores();
    loadClientes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ['valorServicio', 'margen', 'rentabilidad', 'horasSoporte', 'totalIngresos'];
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: numberFields.includes(name) ? Number(value) : value
      };

      if (name === 'nombreProyecto' || name === 'tipoCliente') {
        updated.codigo = generateVigenteCode(updated.nombreProyecto, prospectos, currentId);
      }

      return updated;
    });

    if (name === 'cliente') {
      const filtered = clientesOriginales.filter(c => 
        (c.NomAux || '').toLowerCase().includes(value.toLowerCase()) ||
        (c.RutAux || '').toLowerCase().includes(value.toLowerCase())
      );
      setClientesSugeridos(filtered.slice(0, 50));
      setShowClientesDropdown(true);
    }

    if (name === 'gestorComercial') {
      const filtered = vendedoresOriginales.filter(v => 
        v.VenDes.toLowerCase().includes(value.toLowerCase())
      );
      setVendedoresSugeridos(filtered.slice(0, 50));
      setShowVendedoresDropdown(true);
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setFormData({
      ...defaultFormData,
      codigo: 'proj_01',
      tipoCliente: 'Nuevo'
    });
    setModalMode('add');
    setCurrentId(null);
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p: FichaProspecto) => {
    setFormData({
      codigo: p.codigo || '',
      nombreProyecto: p.nombreProyecto || '',
      estado: p.estado || '10% Prospecto (Lead)',
      cliente: p.cliente || '',
      gestorComercial: p.gestorComercial || '',
      centroCosto: p.centroCosto || '',
      fechaEstimadaAdjudicacion: p.fechaEstimadaAdjudicacion || '',
      fechaAdjudicacion: p.fechaAdjudicacion || '',
      valorServicio: p.valorServicio || 0,
      margen: p.margen || 0,
      rentabilidad: p.rentabilidad || 0,
      plazoEstimado: p.plazoEstimado || '',
      lineaServicio: p.lineaServicio || '',
      fechaInicio: p.fechaInicio || '',
      fechaTermino: p.fechaTermino || '',
      garantia: p.garantia || '',
      horasSoporte: p.horasSoporte || 0,
      totalIngresos: p.totalIngresos || 0,
      tipoCliente: p.tipoCliente || 'Nuevo',
      estimaciones: {
        mensual: p.estimaciones?.mensual || {},
        semanal: p.estimaciones?.semanal || {},
        anual: p.estimaciones?.anual || {}
      }
    });
    setModalMode('edit');
    setCurrentId(p.id);
    setShowModal(true);
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreProyecto || !formData.cliente) {
      showWarning('Nombre de Proyecto y Cliente son obligatorios');
      return;
    }

    try {
      if (modalMode === 'add') {
        const res = await api.post('/fichas-prospecto', formData);
        if (res.data.success) {
          showSuccess('Ficha de prospecto creada exitosamente');
          setShowModal(false);
          loadProspectos();
        } else {
          showError('No se pudo crear la ficha de prospecto');
        }
      } else {
        const res = await api.put(`/fichas-prospecto/${currentId}`, formData);
        if (res.data.success) {
          showSuccess('Ficha de prospecto actualizada exitosamente');
          setShowModal(false);
          loadProspectos();
          if (formData.estado === '100% Aceptada por cliente' && onConvertToProject) {
            onConvertToProject(res.data.data);
          }
        } else {
          showError('No se pudo actualizar la ficha de prospecto');
        }
      }
    } catch (err: any) {
      console.error(err);
      showError('Error al guardar la ficha de prospecto');
    }
  };

  // Open custom delete confirmation modal
  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setShowConfirmDeleteModal(true);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const res = await api.delete(`/fichas-prospecto/${idToDelete}`);
      if (res.data.success) {
        showSuccess('Ficha de prospecto eliminada correctamente');
        loadProspectos();
      } else {
        showError('No se pudo eliminar el prospecto');
      }
    } catch (err: any) {
      console.error(err);
      showError('Error al eliminar prospecto');
    } finally {
      setShowConfirmDeleteModal(false);
      setIdToDelete(null);
    }
  };



  // Quick Status Handlers
  const handleOpenQuickStatus = (e: React.MouseEvent, p: FichaProspecto) => {
    e.stopPropagation();
    setQuickStatusProspecto(p);
    setNewQuickStatus(p.estado);
    setShowQuickStatusModal(true);
  };

  const handleSaveQuickStatus = async () => {
    if (!quickStatusProspecto) return;
    try {
      const res = await api.put(`/fichas-prospecto/${quickStatusProspecto.id}`, {
        estado: newQuickStatus
      });
      if (res.data.success) {
        showSuccess('Estado comercial actualizado correctamente');
        setShowQuickStatusModal(false);
        loadProspectos();
        if (newQuickStatus === '100% Aceptada por cliente' && onConvertToProject) {
          onConvertToProject(res.data.data);
        }
      } else {
        showError('No se pudo actualizar el estado');
      }
    } catch (err) {
      console.error(err);
      showError('Error al actualizar el estado del prospecto');
    }
  };



  // Filtering for List
  const filtered = prospectos.filter(p => {
    const matchesSearch = 
      p.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gestorComercial || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = selectedEstadoFilter === 'todos' || p.estado === selectedEstadoFilter;
    
    return matchesSearch && matchesEstado;
  });

  // Calendar Helpers
  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];



  // Central Calendar view renderers
  const renderCalCentralMensual = () => {
    const year = fechaCalCentral.getFullYear();
    const month = fechaCalCentral.getMonth();
    const dias = getDiasDelMes(year, month);
    
    const primerDia = dias[0];
    const primerDiaSemana = primerDia.getDay();
    const diasVaciosInicio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    const ultimoDia = dias[dias.length - 1];
    const ultimoDiaSemana = ultimoDia.getDay();
    const diasVaciosFin = ultimoDiaSemana === 0 ? 0 : 7 - ultimoDiaSemana;
    
    const celdas: { tipo: 'vacio' | 'dia'; fecha?: Date }[] = [];
    
    for (let i = 0; i < diasVaciosInicio; i++) {
      celdas.push({ tipo: 'vacio' });
    }
    dias.forEach(d => {
      celdas.push({ tipo: 'dia', fecha: d });
    });
    for (let i = 0; i < diasVaciosFin; i++) {
      celdas.push({ tipo: 'vacio' });
    }

    return (
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Cabecera de días */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {diasSemana.map((dia, idx) => (
            <div key={idx} className="py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded">
              {dia}
            </div>
          ))}
        </div>

        {/* Grilla */}
        <div className="grid grid-cols-7 gap-2 bg-gray-100 p-2 rounded-xl">
          {celdas.map((celda, idx) => {
            if (celda.tipo === 'vacio') {
              return <div key={idx} className="bg-gray-50/50 rounded-lg min-h-[120px] border border-transparent"></div>;
            }

            const dayDate = celda.fecha!;
            const nDia = dayDate.getDate();
            const esFinSemana = dayDate.getDay() === 0 || dayDate.getDay() === 6;
            const esHoy = new Date().toDateString() === dayDate.toDateString();

            // Buscar prospectos activos para este día
            const prospectosHoy = prospectos.filter(p => isProspectoActivoEnFecha(p, dayDate));

            return (
              <div 
                key={idx}
                className={`bg-white rounded-lg min-h-[120px] p-1.5 flex flex-col justify-between border transition-all hover:shadow ${
                  esHoy ? 'border-indigo-500 ring-2 ring-indigo-50' : esFinSemana ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200'
                }`}
              >
                <div className="text-right">
                  <span className={`text-[11px] font-bold w-5.5 h-5.5 rounded-full inline-flex items-center justify-center ${
                    esHoy ? 'bg-indigo-600 text-white' : esFinSemana ? 'text-red-500' : 'text-gray-600'
                  }`}>
                    {nDia}
                  </span>
                </div>

                <div className="mt-1 flex-grow overflow-y-auto space-y-1 max-h-[85px] custom-scrollbar pr-0.5">
                  {prospectosHoy.map(p => (
                    <div 
                      key={p.id} 
                      className={`text-[9px] p-1 rounded border leading-tight flex items-center justify-between ${getEstadoColor(p.estado)}`}
                      title={`${p.codigo} - ${p.nombreProyecto} (${p.estado})`}
                    >
                      <div className="truncate flex-1 pr-1">
                        <span className="font-bold block text-[8px] opacity-90">{p.codigo}</span>
                        <span className="font-medium truncate block">{p.nombreProyecto}</span>
                      </div>
                      <button
                        onClick={(e) => handleOpenQuickStatus(e, p)}
                        className="opacity-80 hover:opacity-100 text-[10px] p-0.5"
                        title="Cambiar estado comercial"
                      >
                        ⚙️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalCentralSemanal = () => {
    const diasSem = getDiasDeLaSemana(fechaCalCentral);
    return (
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {diasSem.map((dayDate, idx) => {
            const esHoy = new Date().toDateString() === dayDate.toDateString();
            const esFinSemana = dayDate.getDay() === 0 || dayDate.getDay() === 6;
            const prospectosHoy = prospectos.filter(p => isProspectoActivoEnFecha(p, dayDate));

            return (
              <div 
                key={idx}
                className={`p-3 rounded-xl border min-h-[220px] flex flex-col justify-between ${
                  esHoy ? 'border-indigo-500 bg-indigo-50/20' : esFinSemana ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">{diasSemana[idx === 0 ? 6 : idx - 1] || diasSemana[idx]}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      esHoy ? 'bg-indigo-600 text-white' : 'text-gray-800'
                    }`}>
                      {dayDate.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-0.5">
                    {prospectosHoy.map(p => (
                      <div 
                        key={p.id}
                        className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${getEstadoColor(p.estado)}`}
                        title={`${p.codigo} - ${p.nombreProyecto} (${p.estado})`}
                      >
                        <div className="truncate flex-1 pr-1">
                          <span className="font-bold block text-[8px] opacity-90">{p.codigo}</span>
                          <span className="font-semibold block truncate">{p.nombreProyecto}</span>
                        </div>
                        <button
                          onClick={(e) => handleOpenQuickStatus(e, p)}
                          className="opacity-80 hover:opacity-100 text-[11px]"
                        >
                          ⚙️
                        </button>
                      </div>
                    ))}
                    {prospectosHoy.length === 0 && (
                      <div className="text-[10px] text-gray-400 italic text-center py-6">Sin actividades</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalCentralAnual = () => {
    const year = fechaCalCentral.getFullYear();
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        {mesesNombres.map((mes, mesIdx) => {
          // Filtrar prospectos que estén activos en este mes
          const prospectosMes = prospectos.filter(p => {
            if (p.fechaInicio && p.fechaTermino) {
              const fStart = new Date(p.fechaInicio);
              const fEnd = new Date(p.fechaTermino);
              
              const startLimit = new Date(year, mesIdx, 1).getTime();
              const endLimit = new Date(year, mesIdx + 1, 0).getTime();
              
              const pStart = fStart.getTime();
              const pEnd = fEnd.getTime();
              
              return (pStart <= endLimit && pEnd >= startLimit);
            }
            if (p.fechaEstimadaAdjudicacion) {
              const fAdj = new Date(p.fechaEstimadaAdjudicacion);
              return fAdj.getFullYear() === year && fAdj.getMonth() === mesIdx;
            }
            return false;
          });

          return (
            <div key={mesIdx} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 flex flex-col justify-between min-h-[160px]">
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1 mb-2 border-gray-200">{mes}</h4>
                <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5">
                  {prospectosMes.map(p => (
                    <div 
                      key={p.id}
                      className={`p-1 rounded text-[9px] flex items-center justify-between border ${getEstadoColor(p.estado)}`}
                    >
                      <span className="truncate font-semibold flex-1 pr-1">{p.codigo} - {p.nombreProyecto}</span>
                      <button
                        onClick={(e) => handleOpenQuickStatus(e, p)}
                        className="opacity-80 hover:opacity-100 text-[10px]"
                      >
                        ⚙️
                      </button>
                    </div>
                  ))}
                  {prospectosMes.length === 0 && (
                    <div className="text-[10px] text-gray-400 italic text-center py-6">Sin proyectos</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
      {/* Title & Add button */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Fichas de Prospecto de Proyecto</h2>
          <p className="text-sm text-gray-500">Administra y haz estimaciones de futuros proyectos comerciales</p>
        </div>
        <div className="flex gap-2">
          {/* Sub-tabs switch */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm text-xs font-semibold">
            <button
              onClick={() => setSubTab('lista')}
              className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'lista' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📋 Listado
            </button>
            <button
              onClick={() => setSubTab('calendario')}
              className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'calendario' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📅 Calendario de Estimaciones
            </button>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <span>➕</span> Nueva Ficha
          </button>
        </div>
      </div>

      {subTab === 'lista' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Buscar por código, nombre, cliente o gestor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="w-[200px]">
              <select
                value={selectedEstadoFilter}
                onChange={(e) => setSelectedEstadoFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="todos">Todos los Estados</option>
                {estadosDisponibles.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando prospectos...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
              No se encontraron prospectos de proyectos
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre Proyecto</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Gestor Comercial</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Valor Serv.</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-gray-700 bg-white">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-indigo-600">{p.codigo}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.nombreProyecto}</td>
                        <td className="px-4 py-3">{p.cliente}</td>
                        <td className="px-4 py-3">{p.gestorComercial || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 w-40">
                            <span className="text-xs font-semibold text-gray-700 truncate" title={p.estado}>
                              {p.estado}
                            </span>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  getPercentageFromEstado(p.estado) === 100 ? 'bg-green-500' :
                                  getPercentageFromEstado(p.estado) >= 60 ? 'bg-blue-500' :
                                  getPercentageFromEstado(p.estado) >= 10 ? 'bg-indigo-500' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${getPercentageFromEstado(p.estado)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">${(p.valorServicio || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2.5">
                            <button 
                              onClick={() => handleOpenEdit(p)}
                              className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(p.id)}
                              className="text-red-600 hover:text-red-900 font-semibold text-xs"
                            >
                              Eliminar
                            </button>
                            {p.estado === '100% Aceptada por cliente' && onConvertToProject && (
                              <button 
                                onClick={() => onConvertToProject(p)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                title="Aprobar y crear ficha de proyecto activo"
                              >
                                🚀 Crear Proyecto
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Central Calendar Sub Tab */
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-gray-100 gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const n = new Date(fechaCalCentral);
                  if (calCentralView === 'mensual') n.setMonth(n.getMonth() - 1);
                  else if (calCentralView === 'semanal') n.setDate(n.getDate() - 7);
                  else n.setFullYear(n.getFullYear() - 1);
                  setFechaCalCentral(n);
                }}
                className="p-2 border rounded-lg hover:bg-gray-50 text-xs font-bold"
              >
                ◀ Anterior
              </button>
              <span className="text-sm font-bold text-gray-800 capitalize min-w-[140px] text-center">
                {calCentralView === 'mensual' && `${mesesNombres[fechaCalCentral.getMonth()]} ${fechaCalCentral.getFullYear()}`}
                {calCentralView === 'semanal' && `Semana del ${fechaCalCentral.getDate()}/${fechaCalCentral.getMonth() + 1}`}
                {calCentralView === 'anual' && `Año ${fechaCalCentral.getFullYear()}`}
              </span>
              <button
                onClick={() => {
                  const n = new Date(fechaCalCentral);
                  if (calCentralView === 'mensual') n.setMonth(n.getMonth() + 1);
                  else if (calCentralView === 'semanal') n.setDate(n.getDate() + 7);
                  else n.setFullYear(n.getFullYear() + 1);
                  setFechaCalCentral(n);
                }}
                className="p-2 border rounded-lg hover:bg-gray-50 text-xs font-bold"
              >
                Siguiente ▶
              </button>
              <button
                onClick={() => setFechaCalCentral(new Date())}
                className="p-2 border rounded-lg hover:bg-gray-50 text-xs font-semibold"
              >
                Hoy
              </button>
            </div>

            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setCalCentralView('mensual')}
                className={`px-3 py-1.5 rounded-md transition-all ${calCentralView === 'mensual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setCalCentralView('semanal')}
                className={`px-3 py-1.5 rounded-md transition-all ${calCentralView === 'semanal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'}`}
              >
                Semanal
              </button>
              <button
                onClick={() => setCalCentralView('anual')}
                className={`px-3 py-1.5 rounded-md transition-all ${calCentralView === 'anual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'}`}
              >
                Anual
              </button>
            </div>
          </div>

          {calCentralView === 'mensual' && renderCalCentralMensual()}
          {calCentralView === 'semanal' && renderCalCentralSemanal()}
          {calCentralView === 'anual' && renderCalCentralAnual()}

          {/* Leyenda de colores */}
          <div className="flex flex-wrap gap-4 text-xs bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <span className="font-bold text-gray-500">Estados Comerciales:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gray-400 inline-block"></span>
              <span>0% Abordada/Congelado/Perdida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block"></span>
              <span>10% a 30% Prospecto/Calificación/Elaboración</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block"></span>
              <span>60% a 90% Enviada/Negociación/Asignada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-green-500 inline-block"></span>
              <span>100% Aceptada por cliente</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col my-8 max-h-[85vh]">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === 'add' ? 'Crear Ficha de Prospecto' : 'Editar Ficha de Prospecto'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Seccion 1: Datos Generales */}
              <div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Información del Proyecto</h4>
                
                {/* Tipo de Cliente Selector */}
                <div className="mb-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200 max-w-md">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tipo de Cliente</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="tipoCliente"
                        value="Nuevo"
                        checked={formData.tipoCliente === 'Nuevo'}
                        onChange={(e) => handleInputChange(e as any)}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-gray-700">🆕 Cliente Nuevo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="tipoCliente"
                        value="Vigente"
                        checked={formData.tipoCliente === 'Vigente'}
                        onChange={(e) => handleInputChange(e as any)}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-gray-700">🔄 Cliente Vigente</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Código</label>
                    <input
                      type="text"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 animate-fade-in"
                      required
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Proyecto</label>
                    <input
                      type="text"
                      name="nombreProyecto"
                      value={formData.nombreProyecto}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente</label>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleInputChange}
                      onFocus={() => {
                        const filtered = clientesOriginales.filter(c => 
                          (c.NomAux || '').toLowerCase().includes((formData.cliente || '').toLowerCase()) ||
                          (c.RutAux || '').toLowerCase().includes((formData.cliente || '').toLowerCase())
                        );
                        setClientesSugeridos(filtered.slice(0, 50));
                        setShowClientesDropdown(true);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                      autoComplete="off"
                    />
                    {showClientesDropdown && (clientesSugeridos.length > 0 || loadingClientes) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingClientes ? (
                          <div className="px-4 py-2.5 text-xs text-gray-500 flex items-center gap-2">
                            <span className="animate-spin border-2 border-indigo-500 border-t-transparent rounded-full h-3 w-3 inline-block"></span>
                            Buscando clientes...
                          </div>
                        ) : (
                          clientesSugeridos.map((c) => (
                            <div
                              key={c.CodAux}
                              onClick={() => handleSelectCliente(c)}
                              className="px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors border-b last:border-0 border-gray-100"
                            >
                              <div className="font-bold text-gray-900 leading-tight">{c.NomAux}</div>
                              <div className="text-[10px] text-gray-500 flex justify-between mt-1">
                                <span>RUT: {c.RutAux}</span>
                                {c.VenDes && <span className="text-indigo-600 font-medium">Gestor: {c.VenDes}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Gestor Comercial</label>
                    <input
                      type="text"
                      name="gestorComercial"
                      value={formData.gestorComercial}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (vendedoresOriginales.length === 0) {
                          loadVendedores();
                        }
                        const filtered = vendedoresOriginales.filter(v => 
                          v.VenDes.toLowerCase().includes((formData.gestorComercial || '').toLowerCase())
                        );
                        setVendedoresSugeridos(filtered.slice(0, 50));
                        setShowVendedoresDropdown(true);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoComplete="off"
                    />
                    {showVendedoresDropdown && vendedoresSugeridos.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {vendedoresSugeridos.map((v) => (
                          <div
                            key={v.VenCod}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, gestorComercial: v.VenDes }));
                              setShowVendedoresDropdown(false);
                            }}
                            className="px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors border-b last:border-0 border-gray-100"
                          >
                            <div className="font-semibold text-gray-900">{v.VenDes}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{v.EMail}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Centro de Costo</label>
                    <input
                      type="text"
                      name="centroCosto"
                      value={formData.centroCosto}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {estadosDisponibles.map(est => (
                        <option key={est} value={est}>{est}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            getPercentageFromEstado(formData.estado) === 100 ? 'bg-green-500' :
                            getPercentageFromEstado(formData.estado) >= 60 ? 'bg-blue-500' :
                            getPercentageFromEstado(formData.estado) >= 10 ? 'bg-indigo-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${getPercentageFromEstado(formData.estado)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{getPercentageFromEstado(formData.estado)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seccion 2: Finanzas y Comercial */}
              <div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Finanzas y Valores</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Valor del Servicio ($)</label>
                    <input
                      type="number"
                      name="valorServicio"
                      value={formData.valorServicio}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Margen (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="margen"
                      value={formData.margen}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rentabilidad ($)</label>
                    <input
                      type="number"
                      name="rentabilidad"
                      value={formData.rentabilidad}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Total de Ingresos ($)</label>
                    <input
                      type="number"
                      name="totalIngresos"
                      value={formData.totalIngresos}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Seccion 3: Fechas y Plazos */}
              <div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Fechas y Plazos</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">F. Estimada Adjudicación</label>
                    <input
                      type="date"
                      name="fechaEstimadaAdjudicacion"
                      value={formData.fechaEstimadaAdjudicacion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">F. Adjudicación</label>
                    <input
                      type="date"
                      name="fechaAdjudicacion"
                      value={formData.fechaAdjudicacion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">F. Inicio del Servicio</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">F. Término del Servicio</label>
                    <input
                      type="date"
                      name="fechaTermino"
                      value={formData.fechaTermino}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo Estimado Servicio</label>
                    <input
                      type="text"
                      name="plazoEstimado"
                      value={formData.plazoEstimado}
                      onChange={handleInputChange}
                      placeholder="Ej. 6 meses"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Línea de Servicio</label>
                    <input
                      type="text"
                      name="lineaServicio"
                      value={formData.lineaServicio}
                      onChange={handleInputChange}
                      placeholder="Ej. Desarrollo RPA"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Garantía</label>
                    <input
                      type="text"
                      name="garantia"
                      value={formData.garantia}
                      onChange={handleInputChange}
                      placeholder="Ej. Boleta 10% Venta"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Horas Soporte</label>
                    <input
                      type="number"
                      name="horasSoporte"
                      value={formData.horasSoporte}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>



              {/* Botones de Envío */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
                >
                  {modalMode === 'add' ? 'Crear Ficha' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Quick Status Changer Modal */}
      {showQuickStatusModal && quickStatusProspecto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-gray-800">Actualizar Estado</h4>
                <p className="text-[10px] text-gray-500">{quickStatusProspecto.codigo} - {quickStatusProspecto.nombreProyecto}</p>
              </div>
              <button 
                onClick={() => setShowQuickStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nuevo Estado Comercial</label>
                <select
                  value={newQuickStatus}
                  onChange={(e) => setNewQuickStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {estadosDisponibles.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        getPercentageFromEstado(newQuickStatus) === 100 ? 'bg-green-500' :
                        getPercentageFromEstado(newQuickStatus) >= 60 ? 'bg-blue-500' :
                        getPercentageFromEstado(newQuickStatus) >= 10 ? 'bg-indigo-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${getPercentageFromEstado(newQuickStatus)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{getPercentageFromEstado(newQuickStatus)}%</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowQuickStatusModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuickStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition-all"
                >
                  Guardar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Confirmar Eliminación</h3>
              <button 
                onClick={() => setShowConfirmDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                ¿Está seguro de que desea eliminar esta ficha de prospecto? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichasProspecto;
