import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../services/api';
import emailService from '../services/emailService';
import { showSuccess, showError } from './Toast';

interface Profesional {
  id: string;
  nombre: string;
  correo: string;
  cargo: string;
  fechaRegistro: string;
  activo: boolean;
  horasDisponibles?: number;
  observaciones?: string;
}

interface HorasAsignadasProfesional {
  [profesionalId: string]: {
    [claveProyecto: string]: {
      proyectoId: string;
      proyectoNombre: string;
      horas: number;
      mes: string;
      anio: number;
    };
  };
}

interface Ficha {
  id: string;
  codigo: string;
  nombreProyecto: string;
  cliente: string;
  lider: string;
  liderId?: string;
  descripcion: string;
  tecnologias: string;
  etapaLifecycle?: string;
  venta: number;
  hhImplementacion: number;
  hhPeriodo: number;
  recursos: string[];
  recursosIds?: string[];
  horasPorRecurso?: { [recursoId: string]: number };
  fechaInicio: string;
  fechaTermino: string;
  contraparte: string;
  estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
  avance: number;
  hhPlanificadas: number;
  hhReal: number;
  alertas: string;
  acciones: string;
  responsable: string;
  responsableId?: string;
  bitacora: Array<{
    fecha: string;
    descripcion: string;
  }>;
}

// Componente Modal para Traspasar Ficha a Solicitud de Proyecto (Manual o Email)
const ModalTraspasoSolicitud: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ficha: Ficha | null;
  onManual: (ficha: Ficha) => void;
}> = ({ isOpen, onClose, ficha, onManual }) => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (ficha) {
      const posibleEmail = (ficha.contraparte || '').includes('@') ? ficha.contraparte : '';
      setEmail(posibleEmail);
    }
  }, [ficha]);

  if (!isOpen || !ficha) return null;

  const handleEnviarCorreo = async () => {
    if (!email || !email.includes('@')) {
      showError('Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      setEnviando(true);
      const token = 'TOKEN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      
      const payloadSolicitud = {
        token,
        email,
        nombreProyecto: ficha.nombreProyecto,
        nombreSolicitante: ficha.contraparte || ficha.cliente,
        area: ficha.cliente || 'General',
        nombreContraparteCliente: ficha.contraparte || ficha.cliente,
        nombreResponsableProyecto: ficha.responsable || ficha.lider,
        descripcionGeneral: ficha.descripcion || '',
        presupuesto: ficha.venta || 0,
        fechaInicio: ficha.fechaInicio || new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        observaciones: `Traspasado desde Ficha de Proyecto (Código: ${ficha.codigo})`
      };

      await api.post('/solicitudes', payloadSolicitud);

      const link = `${window.location.origin}/formulario-solicitud/${token}`;
      const resEmail = await emailService.sendFormularioEmail(
        email,
        ficha.nombreProyecto,
        payloadSolicitud.nombreSolicitante,
        payloadSolicitud.area,
        link
      );

      if (resEmail.success) {
        showSuccess('📧 Formulario de Solicitud enviado por correo exitosamente');
        onClose();
      } else {
        showError(resEmail.message || 'Error al enviar el correo');
      }
    } catch (err: any) {
      console.error('Error enviando solicitud por correo:', err);
      showError(err.response?.data?.message || 'Error al enviar la solicitud por correo');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🚀 Traspasar a Solicitud de Proyecto
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wider">Ficha de Proyecto</p>
            <p className="text-base font-bold text-gray-900">{ficha.codigo} - {ficha.nombreProyecto}</p>
            <p className="text-xs text-gray-600">Cliente: {ficha.cliente} {ficha.contraparte ? `| Contraparte: ${ficha.contraparte}` : ''}</p>
          </div>

          <p className="text-sm text-gray-700 font-medium">
            ¿Cómo deseas gestionar la Solicitud de Proyecto?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onManual(ficha);
              }}
              className="p-4 border-2 border-indigo-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/50 rounded-xl transition-all flex flex-col items-center text-center group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">✍️</span>
              <span className="font-bold text-sm text-indigo-900">Rellenar Manualmente</span>
              <span className="text-xs text-gray-500 mt-1">Completar campos en la plataforma</span>
            </button>

            <div className="p-4 border-2 border-purple-200 bg-white rounded-xl flex flex-col justify-between">
              <div className="flex flex-col items-center text-center mb-2">
                <span className="text-3xl mb-1">📧</span>
                <span className="font-bold text-sm text-purple-900">Enviar por Correo</span>
                <span className="text-xs text-gray-500 mt-1">Enviar link al cliente/contraparte</span>
              </div>
              <input
                type="email"
                placeholder="Ingresa el email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded mb-2 focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleEnviarCorreo}
                disabled={enviando}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const ETAPAS_SEQUENTIAL = [
  { id: 'Ingreso', shortLabel: '1. Ingreso', fullLabel: '1. Ingreso', label: '1. Ingreso', icon: '🟡' },
  { id: 'Evaluación', shortLabel: '2. Evalua...', fullLabel: '2. Evaluación', label: '2. Evaluación', icon: '🔵' },
  { id: 'Priorización', shortLabel: '3. Prioriz...', fullLabel: '3. Priorización', label: '3. Priorización', icon: '🟣' },
  { id: 'Comité', shortLabel: '4. Comité', fullLabel: '4. Comité', label: '4. Comité', icon: '🟦' },
  { id: 'Ejecución', shortLabel: '5. Ejecuc...', fullLabel: '5. Ejecución', label: '5. Ejecución', icon: '🟠' },
  { id: 'Aprobación Usuario', shortLabel: '6. Apr. Usr', fullLabel: '6. Aprobación Usuario', label: '6. Aprobación Usuario', icon: '🟪' },
  { id: 'Capacitación', shortLabel: '7. Capacit...', fullLabel: '7. Capacitación', label: '7. Capacitación', icon: '🎓' },
  { id: 'Cierre', shortLabel: '8. Cierre', fullLabel: '8. Cierre', label: '8. Cierre', icon: '🟢' },
];

const getEtapaBadgeClass = (etapa: string): string => {
  switch (etapa) {
    case 'Ingreso': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Evaluación': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Priorización': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Comité': return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'Ejecución': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Aprobación Usuario': return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300';
    case 'Capacitación': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Cierre': return 'bg-green-100 text-green-800 border-green-300';
    case 'Pendiente información': return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Postergado': return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'Pausado': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Rechazado': return 'bg-red-100 text-red-800 border-red-300';
    case 'Cancelado': return 'bg-rose-100 text-rose-800 border-rose-300';
    default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
};

// Componente de Trazabilidad / Stepper del Ciclo de Vida del Proyecto ("Pedido viajando")
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
    <div className="bg-gradient-to-r from-slate-50 via-indigo-50/60 to-purple-50 p-3.5 rounded-xl border border-indigo-100 shadow-xs mt-3 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">📦</span>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Etapa del Proyecto (Trazabilidad)
          </span>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-xs border ${getEtapaBadgeClass(currentStage)}`}>
          {`${currentSeqObj?.icon || '🟡'} ${currentStage}`}
        </span>
      </div>

      {/* Bar & Steps ("Pedido viajando") */}
      <div className="relative my-3 px-1">
        {/* Connecting Line */}
        <div className="absolute top-4 left-7 right-7 h-1 bg-gray-200 rounded -z-0">
          <div 
            className="h-1 transition-all duration-500 rounded bg-indigo-600"
            style={{ width: `${(currentIndex / (ETAPAS_SEQUENTIAL.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps Nodes */}
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
                {/* Active Moving Marker */}
                <div className="h-5 flex items-center justify-center mb-0.5">
                  {isCurrent && (
                    <div className="animate-bounce flex items-center gap-0.5 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-md font-bold whitespace-nowrap">
                      <span>🚀</span>
                      <span className="hidden sm:inline">Aquí</span>
                    </div>
                  )}
                </div>

                {/* Node Circle */}
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 transform group-hover:scale-110 shadow-xs ${
                  isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110' :
                  isCompleted ? 'bg-emerald-500 text-white' :
                  'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : st.icon}
                </div>

                {/* Step Label (sin superposición de texto) */}
                <div className="mt-1.5 w-full">
                  <span className={`block text-[10px] sm:text-[11px] font-bold leading-tight truncate ${
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

      {/* Retractable Options Bar */}
      <div className="mt-2 pt-2 border-t border-indigo-100/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            Selector de Etapas:
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200 shadow-2xs cursor-pointer"
          >
            <span>⚙️ {isExpanded ? 'Ocultar Opciones' : `Cambiar Etapa (${ETAPAS_SEQUENTIAL.length} Opciones)`}</span>
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

const Fichas: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [filteredFichas, setFilteredFichas] = useState<Ficha[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [prospectos, setProspectos] = useState<{ id: string; codigo: string; nombreProyecto: string; cliente?: string; valorServicio?: number; fechaInicio?: string; fechaTermino?: string }[]>([]);
  const [horasAsignadas, setHorasAsignadas] = useState<HorasAsignadasProfesional>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFicha, setCurrentFicha] = useState<Ficha | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Modal Traspaso a Solicitud
  const [showModalTraspasoSolicitud, setShowModalTraspasoSolicitud] = useState(false);
  const [fichaParaTraspaso, setFichaParaTraspaso] = useState<Ficha | null>(null);

  // ✅ Nuevo estado para forzar recreación del modal
  const [modalKey, setModalKey] = useState(0);
  // ✅ Estado para controlar si el código fue traspasado directamente desde prospecto
  const [isCodigoTransferred, setIsCodigoTransferred] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nombreProyecto: '',
    cliente: '',
    lider: '',
    liderId: '',
    descripcion: '',
    tecnologias: '',
    etapaLifecycle: 'Ingreso',
    venta: 0,
    hhImplementacion: 0,
    hhPeriodo: 0,
    recursos: [] as string[],
    recursosIds: [] as string[],
    horasPorRecurso: {} as { [recursoId: string]: number },
    fechaInicio: '',
    fechaTermino: '',
    contraparte: '',
    estado: 'No Iniciada' as 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada',
    avance: 0,
    hhPlanificadas: 0,
    hhReal: 0,
    alertas: '',
    acciones: '',
    responsable: '',
    responsableId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRecursosSelector, setShowRecursosSelector] = useState(false);
  const [tempRecursos, setTempRecursos] = useState<{ id: string; nombre: string; cargo: string; horasDisponibles?: number; horasAsignadas?: number }[]>([]);

  // Softland Clients Autocomplete States
  const [clientesOriginales, setClientesOriginales] = useState<any[]>([]);
  const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowClientesDropdown(false);
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

  // ✅ Extraer código desde observaciones de la solicitud
  const extractCodigoFromObservaciones = (observaciones: string): string | null => {
    if (!observaciones) return null;
    const match = observaciones.match(/C[oó]digo:\s*([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  };

  // ✅ Generar código
  const generateCodigo = (nombre: string) => {
    if (!nombre) return 'proj_01';
    const clean = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    const prefix = clean.substring(0, 4);
    
    if (!prefix) return 'proj_01';

    // Buscar en fichas existentes
    const matchingCodes = fichas
      .filter(f => f.codigo && f.codigo.toLowerCase().startsWith(`${prefix}_`))
      .map(f => {
        const parts = f.codigo.split('_');
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

  // ✅ useEffect para convertir solicitud, prospecto o demanda a ficha de proyecto
  useEffect(() => {
    if (location.state && (location.state.convertFromSolicitud || location.state.convertFromProspecto || location.state.convertFromDemanda)) {
      if (location.state.convertFromDemanda) {
        const demanda = location.state.convertFromDemanda;
        console.log('📝 Convirtiendo demanda a ficha de proyecto:', demanda);

        const profResponsable = profesionales.find(p => 
          p.nombre?.toLowerCase() === (demanda.responsableTI || '').toLowerCase()
        );

        setErrors({});
        setTempRecursos([]);

        const existingFicha = fichas.find(f => 
          (demanda.codigo && f.codigo === demanda.codigo) ||
          (f.nombreProyecto && f.nombreProyecto.trim().toLowerCase() === (demanda.proyecto || '').trim().toLowerCase())
        );

        const etapaSelected = (demanda.etapa && ETAPAS_SEQUENTIAL.some(s => s.id === demanda.etapa))
          ? demanda.etapa
          : 'Ingreso';

        if (existingFicha) {
          setModalMode('edit');
          setCurrentFicha(existingFicha);
          setFormData({
            codigo: demanda.codigo || existingFicha.codigo || '',
            nombreProyecto: existingFicha.nombreProyecto,
            cliente: demanda.solicitante || demanda.area || existingFicha.cliente,
            lider: demanda.responsableTI || existingFicha.lider,
            liderId: profResponsable ? profResponsable.id : (existingFicha.liderId || ''),
            descripcion: existingFicha.descripcion || demanda.observaciones || '',
            tecnologias: existingFicha.tecnologias || '',
            etapaLifecycle: etapaSelected,
            venta: existingFicha.venta || 0,
            hhImplementacion: existingFicha.hhImplementacion || 0,
            hhPeriodo: existingFicha.hhPeriodo || 0,
            recursos: existingFicha.recursos || [],
            recursosIds: existingFicha.recursosIds || [],
            horasPorRecurso: existingFicha.horasPorRecurso || {},
            fechaInicio: existingFicha.fechaInicio || demanda.planificacionReal || demanda.planificacionEstimada || '',
            fechaTermino: existingFicha.fechaTermino || demanda.fechaEstimadaEntrega || '',
            contraparte: existingFicha.contraparte || demanda.solicitante || '',
            estado: existingFicha.estado || 'No Iniciada',
            avance: existingFicha.avance || 0,
            hhPlanificadas: existingFicha.hhPlanificadas || 0,
            hhReal: existingFicha.hhReal || 0,
            alertas: existingFicha.alertas || '',
            acciones: existingFicha.acciones || '',
            responsable: demanda.responsableTI || existingFicha.responsable || '',
            responsableId: profResponsable ? profResponsable.id : (existingFicha.responsableId || ''),
          });
        } else {
          setModalMode('add');
          setCurrentFicha(null);
          setFormData({
            codigo: demanda.codigo || generateCodigo(demanda.proyecto || ''),
            nombreProyecto: demanda.proyecto || '',
            cliente: demanda.solicitante || demanda.area || '',
            lider: demanda.responsableTI || '',
            liderId: profResponsable ? profResponsable.id : '',
            descripcion: demanda.observaciones || '',
            tecnologias: '',
            etapaLifecycle: etapaSelected,
            venta: 0,
            hhImplementacion: 0,
            hhPeriodo: 0,
            recursos: [],
            recursosIds: [],
            horasPorRecurso: {},
            fechaInicio: demanda.planificacionReal || demanda.planificacionEstimada || '',
            fechaTermino: demanda.fechaEstimadaEntrega || '',
            contraparte: demanda.solicitante || '',
            estado: 'No Iniciada',
            avance: 0,
            hhPlanificadas: 0,
            hhReal: 0,
            alertas: '',
            acciones: '',
            responsable: demanda.responsableTI || '',
            responsableId: profResponsable ? profResponsable.id : '',
          });
        }

        setModalKey(prev => prev + 1);
        setTimeout(() => {
          setShowModal(true);
        }, 100);

        navigate(location.pathname, { replace: true, state: {} });
      } else if (location.state.convertFromProspecto) {
        const prospecto = location.state.convertFromProspecto;
        console.log('📝 Convirtiendo prospecto directamente a ficha de proyecto:', prospecto);

        const profResponsable = profesionales.find(p => 
          p.nombre?.toLowerCase() === (prospecto.gestorComercial || '').toLowerCase()
        );

        setErrors({});
        setTempRecursos([]);
        setModalMode('add');
        setIsCodigoTransferred(true);

        setFormData({
          codigo: prospecto.codigo || '',
          nombreProyecto: prospecto.nombreProyecto || '',
          cliente: prospecto.cliente || '',
          lider: '',
          liderId: '',
          descripcion: prospecto.observaciones || '',
          tecnologias: '',
          etapaLifecycle: 'Prospecto',
          venta: prospecto.valorServicio || prospecto.totalIngresos || 0,
          hhImplementacion: 0,
          hhPeriodo: 0,
          recursos: [],
          recursosIds: [],
          horasPorRecurso: {},
          fechaInicio: prospecto.fechaInicio ? prospecto.fechaInicio.split('T')[0] : (prospecto.fechaAdjudicacion ? prospecto.fechaAdjudicacion.split('T')[0] : ''),
          fechaTermino: prospecto.fechaTermino ? prospecto.fechaTermino.split('T')[0] : '',
          contraparte: prospecto.cliente || '',
          estado: 'No Iniciada',
          avance: 0,
          hhPlanificadas: 0,
          hhReal: 0,
          alertas: '',
          acciones: '',
          responsable: prospecto.gestorComercial || '',
          responsableId: profResponsable ? profResponsable.id : '',
        });

        setModalKey(prev => prev + 1);
        setTimeout(() => {
          setShowModal(true);
        }, 100);

        navigate(location.pathname, { replace: true, state: {} });
      } else if (location.state.convertFromSolicitud) {
        const solicitud = location.state.convertFromSolicitud;
        console.log('📝 Convirtiendo solicitud a ficha:', solicitud);
        
        const profResponsable = profesionales.find(p => 
          p.nombre?.toLowerCase() === (solicitud.nombreResponsableProyecto || '').toLowerCase()
        );
        
        const fechaInicio = solicitud.fechaInicio 
          ? solicitud.fechaInicio.split('T')[0] 
          : '';
        
        setErrors({});
        setTempRecursos([]);
        setModalMode('add');
        
        const extractedCode = extractCodigoFromObservaciones(solicitud.observaciones || '');

        setFormData({
          codigo: extractedCode || generateCodigo(solicitud.nombreProyecto || ''),
          nombreProyecto: solicitud.nombreProyecto || '',
          cliente: solicitud.nombreContraparteCliente || solicitud.area || '',
          lider: '',
          liderId: '',
          descripcion: solicitud.observaciones || '',
          tecnologias: '',
          etapaLifecycle: 'Solicitud',
          venta: solicitud.presupuesto || 0,
          hhImplementacion: 0,
          hhPeriodo: 0,
          recursos: [],
          recursosIds: [],
          horasPorRecurso: {},
          fechaInicio: fechaInicio,
          fechaTermino: '',
          contraparte: solicitud.nombreContraparteCliente || '',
          estado: 'No Iniciada',
          avance: 0,
          hhPlanificadas: 0,
          hhReal: 0,
          alertas: '',
          acciones: '',
          responsable: solicitud.nombreResponsableProyecto || '',
          responsableId: profResponsable ? profResponsable.id : '',
        });
        
        setModalKey(prev => prev + 1);
        setTimeout(() => {
          setShowModal(true);
        }, 100);
        
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, profesionales, navigate]);

  // Calcular horas totales
  const horasTotales = Number(formData.hhImplementacion) + Number(formData.hhPeriodo) + Number(formData.hhPlanificadas);
  const cantidadRecursos = formData.recursosIds.length;

  const obtenerMesAnio = (fecha: string): { mes: string; anio: number } => {
    if (!fecha) return { mes: '', anio: 0 };
    const date = new Date(fecha);
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return {
      mes: meses[date.getMonth()],
      anio: date.getFullYear()
    };
  };

  const getHorasDisponibles = (prof: Profesional) => {
    const asignacionesProf = horasAsignadas[prof.id] || {};
    let totalHorasAsignadas = 0;
    
    Object.entries(asignacionesProf).forEach(([, item]) => {
      // Si estamos editando y esta asignación corresponde al proyecto actual, no la sumamos a la carga ocupada
      if (currentFicha && item.proyectoId === currentFicha.id) {
        return;
      }
      totalHorasAsignadas += item.horas;
    });

    const base = prof.horasDisponibles !== undefined ? prof.horasDisponibles : 160;
    const horasRestantes = base - totalHorasAsignadas;
    return horasRestantes >= 0 ? horasRestantes : 0;
  };

  const asignarHorasAProfesionales = async (ficha: Ficha) => {
    const recursosIds = ficha.recursosIds || [];
    const horasPorRecurso = ficha.horasPorRecurso || {};
    
    if (recursosIds.length === 0) return;
    
    const { mes, anio } = obtenerMesAnio(ficha.fechaInicio);
    if (!mes) return;
    
    const nuevasAsignaciones = { ...horasAsignadas };
    const claveProyecto = `${ficha.id}_${mes}_${anio}`;
    
    recursosIds.forEach(profId => {
      const horasAsignadasProf = horasPorRecurso[profId] || 0;
      if (horasAsignadasProf > 0) {
        if (!nuevasAsignaciones[profId]) {
          nuevasAsignaciones[profId] = {};
        }
        
        nuevasAsignaciones[profId][claveProyecto] = {
          proyectoId: ficha.id,
          proyectoNombre: ficha.nombreProyecto,
          horas: horasAsignadasProf,
          mes: mes,
          anio: anio
        };
      }
    });
    
    setHorasAsignadas(nuevasAsignaciones);
    localStorage.setItem('rpa_horas_asignadas', JSON.stringify(nuevasAsignaciones));
  };

  const eliminarHorasDeProfesionales = (ficha: Ficha) => {
    const recursosIds = ficha.recursosIds || [];
    const { mes, anio } = obtenerMesAnio(ficha.fechaInicio);
    
    if (!mes || recursosIds.length === 0) return;
    
    const nuevasAsignaciones = { ...horasAsignadas };
    const claveProyecto = `${ficha.id}_${mes}_${anio}`;
    
    recursosIds.forEach(profId => {
      if (nuevasAsignaciones[profId] && nuevasAsignaciones[profId][claveProyecto]) {
        delete nuevasAsignaciones[profId][claveProyecto];
        if (Object.keys(nuevasAsignaciones[profId]).length === 0) {
          delete nuevasAsignaciones[profId];
        }
      }
    });
    
    setHorasAsignadas(nuevasAsignaciones);
    localStorage.setItem('rpa_horas_asignadas', JSON.stringify(nuevasAsignaciones));
  };

  // Cargar profesionales desde la API
  const loadProfesionales = async () => {
    try {
      const response = await api.get('/profesionales');
      if (response.data.success) {
        setProfesionales(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      setProfesionales([]);
    }
  };

  // Cargar fichas desde la API
  const loadFichas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/fichas');
      if (response.data.success) {
        setFichas(response.data.data || []);
        setFilteredFichas(response.data.data || []);
      } else {
        setError('Error al cargar fichas');
        setFichas([]);
        setFilteredFichas([]);
      }
    } catch (err: any) {
      console.error('Error cargando fichas:', err);
      setError(err.response?.data?.message || 'Error al cargar fichas');
      setFichas([]);
      setFilteredFichas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHorasAsignadas = () => {
    try {
      const storedHoras = localStorage.getItem('rpa_horas_asignadas');
      if (storedHoras) {
        const parsed = JSON.parse(storedHoras);
        setHorasAsignadas(parsed);
      }
    } catch (error) {
      console.error('Error cargando horas asignadas:', error);
    }
  };

  const loadProspectos = async () => {
    try {
      const res = await api.get('/fichas-prospecto');
      const raw = res.data?.data || res.data || [];
      if (Array.isArray(raw)) {
        setProspectos(raw.map((p: any) => ({
          id: String(p.id),
          codigo: p.codigo || p.Codigo || `PR-${p.id}`,
          nombreProyecto: p.nombreProyecto || p.NombreProyecto || '',
          cliente: p.cliente || p.Cliente || '',
          valorServicio: p.valorServicio || p.totalIngresos || 0,
          fechaInicio: p.fechaInicio ? p.fechaInicio.split('T')[0] : (p.fechaAdjudicacion ? p.fechaAdjudicacion.split('T')[0] : ''),
          fechaTermino: p.fechaTermino ? p.fechaTermino.split('T')[0] : ''
        })));
      }
    } catch (err) {
      console.error('Error cargando prospectos:', err);
    }
  };

  useEffect(() => {
    loadProfesionales();
    loadFichas();
    loadHorasAsignadas();
    loadClientes();
    loadProspectos();

    const handleStorageChange = () => {
      loadProfesionales();
      loadFichas();
      loadHorasAsignadas();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('solicitudes-updated', handleFichasUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('solicitudes-updated', handleFichasUpdate);
    };
  }, []);

  const handleFichasUpdate = () => {
    loadFichas();
  };

  useEffect(() => {
    let filtered = fichas;
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.lider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(f => f.estado === selectedEstado);
    }

    setFilteredFichas(filtered);
  }, [searchTerm, selectedEstado, fichas]);

  // ✅ CORREGIDO: handleInputChange para manejar todos los campos correctamente
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`📝 Cambiando campo ${name} a:`, value);
    
    // Si es nombreProyecto y estamos en modo add sin código traspasado, generar código automáticamente
    if (name === 'nombreProyecto' && modalMode === 'add' && !isCodigoTransferred) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        codigo: generateCodigo(value)
      }));
    } else if (name === 'lider') {
      const selectedProf = profesionales.find(p => p.id === value);
      setFormData(prev => ({
        ...prev,
        lider: selectedProf ? selectedProf.nombre : '',
        liderId: value
      }));
    } else if (name === 'responsable') {
      const selectedProf = profesionales.find(p => p.id === value);
      setFormData(prev => ({
        ...prev,
        responsable: selectedProf ? selectedProf.nombre : '',
        responsableId: value
      }));
    } else {
      // Para todos los demás campos, actualizar normalmente
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'cliente') {
      const filtered = clientesOriginales.filter(c => 
        (c.NomAux || '').toLowerCase().includes(value.toLowerCase()) ||
        (c.RutAux || '').toLowerCase().includes(value.toLowerCase())
      );
      setClientesSugeridos(filtered.slice(0, 50));
      setShowClientesDropdown(true);
    }
  };

  const handleHorasPorRecursoChange = (recursoId: string, horas: number) => {
    setFormData(prev => ({
      ...prev,
      horasPorRecurso: {
        ...prev.horasPorRecurso,
        [recursoId]: horas
      }
    }));
    
    setTempRecursos(prev => prev.map(r => 
      r.id === recursoId ? { ...r, horasAsignadas: horas } : r
    ));
  };

  const openRecursosSelector = () => {
    const currentRecursos = formData.recursosIds.map(id => {
      const prof = profesionales.find(p => p.id === id);
      return prof ? { 
        id: prof.id, 
        nombre: prof.nombre, 
        cargo: prof.cargo, 
        horasDisponibles: getHorasDisponibles(prof),
        horasAsignadas: formData.horasPorRecurso[id] || 0
      } : null;
    }).filter(p => p !== null) as { id: string; nombre: string; cargo: string; horasDisponibles?: number; horasAsignadas?: number }[];
    
    setTempRecursos(currentRecursos);
    setShowRecursosSelector(true);
  };

  const addRecurso = (profesional: Profesional) => {
    if (!tempRecursos.some(r => r.id === profesional.id)) {
      const horasPorDefecto = cantidadRecursos > 0 ? Math.floor(horasTotales / (cantidadRecursos + 1)) : 0;
      setTempRecursos([...tempRecursos, {
        id: profesional.id,
        nombre: profesional.nombre,
        cargo: profesional.cargo,
        horasDisponibles: getHorasDisponibles(profesional),
        horasAsignadas: horasPorDefecto
      }]);
    }
  };

  const removeRecurso = (id: string) => {
    setTempRecursos(tempRecursos.filter(r => r.id !== id));
  };

  const confirmRecursos = () => {
    const nuevasHorasPorRecurso: { [key: string]: number } = {};
    tempRecursos.forEach(r => {
      nuevasHorasPorRecurso[r.id] = r.horasAsignadas || 0;
    });
    
    setFormData(prev => ({
      ...prev,
      recursosIds: tempRecursos.map(r => r.id),
      recursos: tempRecursos.map(r => r.nombre),
      horasPorRecurso: nuevasHorasPorRecurso
    }));
    setShowRecursosSelector(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombreProyecto) newErrors.nombreProyecto = 'El nombre es obligatorio';
    if (!formData.cliente) newErrors.cliente = 'El cliente es obligatorio';
    if (!formData.lider) newErrors.lider = 'El líder es obligatorio';
    if (formData.venta <= 0) newErrors.venta = 'La venta debe ser mayor a 0';
    
    if (formData.recursosIds.length > 0) {
      const totalHorasAsignadas = Object.values(formData.horasPorRecurso).reduce((sum, h) => sum + (h || 0), 0);
      if (totalHorasAsignadas !== horasTotales) {
        newErrors.horas = `La suma de horas asignadas (${totalHorasAsignadas} hrs) debe ser igual al total del proyecto (${horasTotales} hrs)`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setModalMode('add');
    setIsCodigoTransferred(false);
    setFormData({
      codigo: '',
      nombreProyecto: '',
      cliente: '',
      lider: '',
      liderId: '',
      descripcion: '',
      tecnologias: '',
      etapaLifecycle: 'Ingreso',
      venta: 0,
      hhImplementacion: 0,
      hhPeriodo: 0,
      recursos: [],
      recursosIds: [],
      horasPorRecurso: {},
      fechaInicio: '',
      fechaTermino: '',
      contraparte: '',
      estado: 'No Iniciada',
      avance: 0,
      hhPlanificadas: 0,
      hhReal: 0,
      alertas: '',
      acciones: '',
      responsable: '',
      responsableId: '',
    });
    setTempRecursos([]);
    setErrors({});
    setModalKey(prev => prev + 1);
    setShowModal(true);
  };

  const handleEdit = (ficha: Ficha) => {
    setModalMode('edit');
    setCurrentFicha(ficha);
    const profLider = profesionales.find(p => p.nombre.toLowerCase() === (ficha.lider || '').toLowerCase());
    const profResponsable = profesionales.find(p => p.nombre.toLowerCase() === (ficha.responsable || '').toLowerCase());
    setFormData({
      codigo: ficha.codigo,
      nombreProyecto: ficha.nombreProyecto,
      cliente: ficha.cliente,
      lider: ficha.lider,
      liderId: profLider ? profLider.id : '',
      descripcion: ficha.descripcion,
      tecnologias: ficha.tecnologias,
      etapaLifecycle: ficha.etapaLifecycle || (ficha.estado === 'Completada' ? 'Cierre' : 'Ingreso'),
      venta: ficha.venta,
      hhImplementacion: ficha.hhImplementacion,
      hhPeriodo: ficha.hhPeriodo,
      recursos: ficha.recursos,
      recursosIds: ficha.recursosIds || [],
      horasPorRecurso: ficha.horasPorRecurso || {},
      fechaInicio: ficha.fechaInicio,
      fechaTermino: ficha.fechaTermino,
      contraparte: ficha.contraparte,
      estado: ficha.estado,
      avance: ficha.avance,
      hhPlanificadas: ficha.hhPlanificadas,
      hhReal: ficha.hhReal,
      alertas: ficha.alertas,
      acciones: ficha.acciones,
      responsable: ficha.responsable,
      responsableId: profResponsable ? profResponsable.id : '',
    });
    setTempRecursos((ficha.recursosIds || []).map(id => {
      const prof = profesionales.find(p => p.id === id);
      return prof ? { 
        id: prof.id, 
        nombre: prof.nombre, 
        cargo: prof.cargo, 
        horasDisponibles: prof.horasDisponibles,
        horasAsignadas: (ficha.horasPorRecurso && ficha.horasPorRecurso[id]) || 0
      } : null;
    }).filter(p => p !== null) as { id: string; nombre: string; cargo: string; horasDisponibles?: number; horasAsignadas?: number }[]);
    setErrors({});
    setModalKey(prev => prev + 1);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setFichaToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (fichaToDelete) {
      const fichaToDeleteObj = fichas.find(f => f.id === fichaToDelete);
      if (fichaToDeleteObj) {
        eliminarHorasDeProfesionales(fichaToDeleteObj);
      }
      
      try {
        const response = await api.delete(`/fichas/${fichaToDelete}`);
        if (response.data.success) {
          setFichas(prev => prev.filter(f => f.id !== fichaToDelete));
          setFilteredFichas(prev => prev.filter(f => f.id !== fichaToDelete));
        } else {
          setError(response.data.message || 'Error al eliminar ficha');
        }
      } catch (err: any) {
        console.error('Error eliminando ficha:', err);
        setError(err.response?.data?.message || 'Error al eliminar ficha');
      }
      
      setShowDeleteConfirm(false);
      setFichaToDelete(null);
    }
  };

  const handleAbrirTraspasoSolicitud = (ficha: Ficha) => {
    setFichaParaTraspaso(ficha);
    setShowModalTraspasoSolicitud(true);
  };

  const handleConfirmarManualTraspaso = (ficha: Ficha) => {
    navigate('/solicitud-proyecto', { state: { convertFromFicha: ficha } });
  };

  // ✅ CORREGIDO: Función handleSubmit completa
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    
    // Preparar datos para enviar
    const fichaData = {
      ...formData,
      horasPorRecurso: formData.horasPorRecurso || {},
      bitacora: modalMode === 'add' ? [] : currentFicha?.bitacora || []
    };

    try {
      let response;
      if (modalMode === 'add') {
        response = await api.post('/fichas', fichaData);
        if (response.data.success) {
          const newFicha = response.data.data;
          setFichas(prev => [...prev, newFicha]);
          setFilteredFichas(prev => [...prev, newFicha]);
          
          if (formData.recursosIds && formData.recursosIds.length > 0) {
            await asignarHorasAProfesionales(newFicha);
          }
          
          if (location.state?.convertFromSolicitud) {
            console.log('✅ Ficha creada desde solicitud aprobada');
          } else {
            // Abrir modal de traspaso a Solicitud de Proyecto
            setFichaParaTraspaso(newFicha);
            setShowModalTraspasoSolicitud(true);
          }
        }
      } else {
        if (currentFicha) {
          eliminarHorasDeProfesionales(currentFicha);
          
          response = await api.put(`/fichas/${currentFicha.id}`, fichaData);
          if (response.data.success) {
            const updatedFicha = response.data.data;
            setFichas(prev => prev.map(f => 
              f.id === currentFicha.id ? updatedFicha : f
            ));
            setFilteredFichas(prev => prev.map(f => 
              f.id === currentFicha.id ? updatedFicha : f
            ));
            
            if (formData.recursosIds && formData.recursosIds.length > 0) {
              await asignarHorasAProfesionales(updatedFicha);
            }
          }
        }
      }
      
      if (response && response.data.success) {
        setShowModal(false);
        setCurrentFicha(null);
        setErrors({});
        setSaving(false);
        
        if (location.state?.convertFromSolicitud) {
          window.history.replaceState({}, document.title);
        }
        
        console.log('✅ Ficha guardada exitosamente');
        
      } else {
        setError(response?.data?.message || 'Error al guardar ficha');
        setSaving(false);
      }
    } catch (err: any) {
      console.error('Error guardando ficha:', err);
      setError(err.response?.data?.message || 'Error al guardar ficha');
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredFichas.map(f => ({
      'Código': f.codigo,
      'Proyecto': f.nombreProyecto,
      'Cliente': f.cliente,
      'Líder': f.lider,
      'Descripción': f.descripcion,
      'Tecnologías': f.tecnologias,
      'Venta ($)': f.venta,
      'HH Implementación': f.hhImplementacion,
      'HH Periodo': f.hhPeriodo,
      'HH Planificadas': f.hhPlanificadas,
      'HH Total': f.hhImplementacion + f.hhPeriodo + f.hhPlanificadas,
      'Recursos': f.recursos.join(', '),
      'Horas por Recurso': Object.entries(f.horasPorRecurso || {}).map(([id, horas]) => {
        const prof = profesionales.find(p => p.id === id);
        return `${prof?.nombre || id}: ${horas}h`;
      }).join('; '),
      'Fecha Inicio': f.fechaInicio,
      'Fecha Término': f.fechaTermino,
      'Contraparte': f.contraparte,
      'Estado': f.estado,
      'Avance %': f.avance,
      'HH Real': f.hhReal,
      'Alertas': f.alertas || '',
      'Acciones': f.acciones || '',
      'Responsable': f.responsable,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Fichas');
    const fecha = new Date();
    const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}-${fecha.getDate().toString().padStart(2,'0')}`;
    XLSX.writeFile(wb, `RPA_Fichas_${fechaStr}.xlsx`);
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'En Curso': return 'bg-green-500 text-white';
      case 'Standby': return 'bg-yellow-500 text-white';
      case 'No Iniciada': return 'bg-gray-500 text-white';
      case 'Completada': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando fichas...</p>
        </div>
      </div>
    );
  }

  const profesionalesActivos = profesionales.filter(p => p.activo === true);
  const totalHorasAsignadas = Object.values(formData.horasPorRecurso).reduce((sum, h) => sum + (h || 0), 0);
  const horasFaltantes = horasTotales - totalHorasAsignadas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto">
              <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-indigo-600 mr-2 sm:mr-4 text-xs sm:text-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver</span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Gestión Fichas Proyecto
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={loadFichas}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center px-2 sm:px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-1 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleAdd} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nueva Ficha Proyecto</span>
            </button>

            <button 
              onClick={exportToExcel} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

          <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  <svg className="absolute left-2 top-7 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500">
                    <option value="todos">Todos</option>
                    <option value="En Curso">Curso</option>
                    <option value="Standby">Standby</option>
                    <option value="No Iniciada">No Ini</option>
                    <option value="Completada">Compl</option>
                  </select>
                </div>
                <div className="xs:col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Registros</label>
                  <div className="bg-gray-100 px-3 py-1.5 rounded border border-gray-300 text-xs sm:text-sm">{filteredFichas.length} fichas</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">Código</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden xs:table-cell">Proyecto</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">HH Total</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden lg:table-cell">Recursos</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">Etapa</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">Estado</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">Avance</th>
                      <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFichas.length > 0 ? (
                      filteredFichas.map((ficha, index) => (
                        <tr key={ficha.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50`}>
                          <td className="px-2 sm:px-3 py-2 font-medium">{ficha.codigo}</td>
                          <td className="px-2 sm:px-3 py-2 truncate max-w-[100px] xs:max-w-none hidden xs:table-cell">{ficha.nombreProyecto}</td>
                          <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{ficha.cliente}</td>
                          <td className="px-2 sm:px-3 py-2 text-purple-600 font-bold">{ficha.hhImplementacion + ficha.hhPeriodo + ficha.hhPlanificadas} hrs</td>
                          <td className="px-2 sm:px-3 py-2 hidden lg:table-cell">
                            <div className="text-xs">
                              {ficha.recursos.slice(0, 2).join(', ')}
                              {ficha.recursos.length > 2 && ` +${ficha.recursos.length - 2}`}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 min-w-[150px]">
                            {(() => {
                              const stage = ficha.etapaLifecycle || (ficha.estado === 'Completada' ? 'Cierre' : 'Ingreso');
                              const stageIndex = ETAPAS_SEQUENTIAL.findIndex(s => s.id === stage);

                              return (
                                <div className="space-y-1">
                                  <select
                                    value={stage}
                                    onChange={async (e) => {
                                      const newEtapa = e.target.value;
                                      try {
                                        const res = await api.put(`/fichas/${ficha.id}`, { etapaLifecycle: newEtapa });
                                        if (res.data.success) {
                                          setFichas(prev => prev.map(f => f.id === ficha.id ? { ...f, etapaLifecycle: newEtapa } : f));
                                          setFilteredFichas(prev => prev.map(f => f.id === ficha.id ? { ...f, etapaLifecycle: newEtapa } : f));
                                        }
                                      } catch (err) {
                                        console.error('Error actualizando etapa:', err);
                                      }
                                    }}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs ${getEtapaBadgeClass(stage)}`}
                                  >
                                    {ETAPAS_SEQUENTIAL.map(st => (
                                      <option key={st.id} value={st.id} className="bg-white text-gray-800">
                                        {st.icon} {st.fullLabel}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-0.5 w-full max-w-[120px] pt-0.5" title={`Etapa actual: ${stage}`}>
                                    {ETAPAS_SEQUENTIAL.map((st, idx) => {
                                      const isCompleted = idx < stageIndex;
                                      const isCurrent = idx === stageIndex;
                                      return (
                                        <div 
                                          key={st.id} 
                                          className={`h-1 flex-1 rounded-full transition-all ${
                                            isCurrent ? 'bg-purple-600 ring-1 ring-purple-300 animate-pulse' :
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
                          <td className="px-2 sm:px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-white text-xs font-bold ${getEstadoColor(ficha.estado)}`}>
                              {ficha.estado}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex items-center gap-1">
                              <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full">
                                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${ficha.avance}%` }}></div>
                              </div>
                              <span className="text-xs">{ficha.avance}%</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleEdit(ficha)} className="text-purple-600 hover:text-purple-800 p-1" title="Editar">✏️</button>
                              <button onClick={() => handleDelete(ficha.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">🗑️</button>
                              <button
                                onClick={() => handleAbrirTraspasoSolicitud(ficha)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                title="Traspasar datos a Solicitud de Proyecto"
                              >
                                📋 Pasar a Solicitud
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-6 text-center text-gray-400">No hay fichas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 text-xs"><span>📊 {filteredFichas.length} registros</span></div>
            </div>
          </main>

          {/* ✅ MODAL CORREGIDO CON KEY PARA FORZAR RECREACIÓN */}
          {showModal && (
            <div key={modalKey} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {modalMode === 'add' 
                      ? (isCodigoTransferred ? `🚀 Crear Ficha de Proyecto (Código: ${formData.codigo})` : (location.state?.convertFromSolicitud ? '📝 Convertir Solicitud a Ficha' : '➕ Nueva Ficha de Proyecto'))
                      : '✏️ Editar Ficha'
                    }
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* ✅ Botón de emergencia para forzar habilitación */}
                    <button 
                      type="button"
                      onClick={() => {
                        console.log('🔓 Forzando habilitación de edición');
                        setFormData(prev => ({ ...prev }));
                        setErrors({});
                        setModalKey(prev => prev + 1);
                      }}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      🔓 Habilitar
                    </button>
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        setIsCodigoTransferred(false);
                        if (location.state?.convertFromSolicitud) {
                          window.history.replaceState({}, document.title);
                        }
                      }} 
                      className="text-white hover:text-gray-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {isCodigoTransferred && (
                      <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3">
                        <span className="text-xl">📋</span>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-indigo-900">
                            Información traspasada directamente desde Prospecto ({formData.codigo})
                          </p>
                          <p className="text-xs text-indigo-700 mt-0.5">
                            Se cargaron el Nombre, Cliente, Venta y Fechas del prospecto. Por favor selecciona el <strong>Líder del Proyecto</strong> y asigna los <strong>Recursos y Horas HH</strong> para completar la Ficha de Proyecto.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Vincular Ficha Prospecto (Auto-completar Código, Nombre y Cliente) */}
                    {prospectos.length > 0 && (
                      <div className="mb-4 bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 shadow-xs">
                        <label className="block text-xs font-bold text-purple-900 mb-1.5 flex items-center gap-1.5">
                          <span>📋</span>
                          <span>Seleccionar Ficha Prospecto (Sincroniza Código y Datos)</span>
                        </label>
                        <select
                          value={prospectos.find(p => p.codigo === formData.codigo)?.id || ''}
                          onChange={(e) => {
                            const selected = prospectos.find(p => p.id === e.target.value);
                            if (selected) {
                              setFormData(prev => ({
                                ...prev,
                                codigo: selected.codigo,
                                nombreProyecto: selected.nombreProyecto,
                                cliente: prev.cliente || selected.cliente || '',
                                venta: prev.venta || selected.valorServicio || 0,
                                fechaInicio: prev.fechaInicio || selected.fechaInicio || '',
                                fechaTermino: prev.fechaTermino || selected.fechaTermino || ''
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 font-medium text-gray-800"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Código Proyecto (Prospecto) - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🔑 Código Proyecto (Prospecto)</label>
                          <input 
                            type="text" 
                            name="codigo" 
                            value={formData.codigo || ''} 
                            onChange={handleInputChange} 
                            placeholder="Ej: PR-2026-001"
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded font-mono focus:border-purple-500 outline-none" 
                          />
                        </div>

                        {/* Nombre del Proyecto - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📁 Nombre del Proyecto *</label>
                          <input 
                            type="text" 
                            name="nombreProyecto" 
                            value={formData.nombreProyecto || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            required 
                            autoFocus
                          />
                          {errors.nombreProyecto && <p className="text-red-500 text-xs mt-1">{errors.nombreProyecto}</p>}
                        </div>

                        {/* Cliente - EDITABLE */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🏢 Cliente *</label>
                          <input 
                            type="text" 
                            name="cliente" 
                            value={formData.cliente || ''} 
                            onChange={handleInputChange} 
                            onFocus={() => {
                              const filtered = clientesOriginales.filter(c => 
                                (c.NomAux || '').toLowerCase().includes((formData.cliente || '').toLowerCase()) ||
                                (c.RutAux || '').toLowerCase().includes((formData.cliente || '').toLowerCase())
                              );
                              setClientesSugeridos(filtered.slice(0, 50));
                              setShowClientesDropdown(true);
                            }}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            required 
                            autoComplete="off"
                          />
                          {errors.cliente && <p className="text-red-500 text-xs mt-1">{errors.cliente}</p>}
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
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, cliente: c.NomAux }));
                                      setShowClientesDropdown(false);
                                    }}
                                    className="px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors border-b last:border-0 border-gray-100"
                                  >
                                    <div className="font-bold text-gray-900 leading-tight">{c.NomAux}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">RUT: {c.RutAux}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Líder - Select editable */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👤 Líder *</label>
                          <select 
                            name="lider" 
                            value={formData.liderId || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            required
                          >
                            <option value="">Seleccionar líder...</option>
                            {profesionalesActivos.map(prof => (
                              <option key={prof.id} value={prof.id}>
                                {prof.nombre} - {prof.cargo}
                              </option>
                            ))}
                          </select>
                          {errors.lider && <p className="text-red-500 text-xs mt-1">{errors.lider}</p>}
                        </div>

                        {/* Descripción - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📝 Descripción</label>
                          <textarea 
                            name="descripcion" 
                            value={formData.descripcion || ''} 
                            onChange={handleInputChange} 
                            rows={3} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                          />
                        </div>

                        {/* Tecnologías - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">💻 Tecnologías</label>
                          <input 
                            type="text" 
                            name="tecnologias" 
                            value={formData.tecnologias || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            placeholder="Ej: Python, JavaScript" 
                          />
                        </div>

                        {/* ✅ NUEVO: Seguidor Visual de Etapa del Proyecto / Trazabilidad ("Pedido viajando") */}
                        <ProjectLifecycleStepper
                          currentStage={formData.etapaLifecycle || 'Ingreso'}
                          onStageChange={(stage) => setFormData(prev => ({ ...prev, etapaLifecycle: stage }))}
                        />
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {/* Venta - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">💰 Venta ($) *</label>
                          <input 
                            type="number" 
                            name="venta" 
                            value={formData.venta || 0} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            required 
                          />
                          {errors.venta && <p className="text-red-500 text-xs mt-1">{errors.venta}</p>}
                        </div>

                        {/* HH - EDITABLE */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⏱️ HH Implementación</label>
                            <input 
                              type="number" 
                              name="hhImplementacion" 
                              value={formData.hhImplementacion || 0} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⏱️ HH Periodo</label>
                            <input 
                              type="number" 
                              name="hhPeriodo" 
                              value={formData.hhPeriodo || 0} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📋 HH Plan</label>
                            <input 
                              type="number" 
                              name="hhPlanificadas" 
                              value={formData.hhPlanificadas || 0} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                        </div>

                        {/* Recursos - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👥 Recursos</label>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={openRecursosSelector} 
                              className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Seleccionar Recursos y Asignar Horas
                            </button>
                          </div>
                          {formData.recursos.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Recursos seleccionados:</p>
                              <div className="flex flex-wrap gap-2">
                                {formData.recursosIds.map((recursoId, idx) => {
                                  const recurso = profesionales.find(p => p.id === recursoId);
                                  const horas = formData.horasPorRecurso[recursoId] || 0;
                                  return (
                                    <div key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                      {recurso?.nombre}: {horas} hrs
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200 bg-blue-50 p-2 rounded">
                                <p className="text-sm font-semibold text-gray-800 mb-1">📊 Distribución de Horas:</p>
                                <p className="text-xs text-gray-700">
                                  <span className="font-semibold">Total HH del proyecto:</span> {horasTotales} hrs
                                </p>
                                <p className="text-xs text-gray-700">
                                  <span className="font-semibold">Total HH asignadas:</span> {totalHorasAsignadas} hrs
                                </p>
                                {horasFaltantes !== 0 && (
                                  <p className={`text-xs font-semibold ${horasFaltantes > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                    {horasFaltantes > 0 ? `Faltan asignar: ${horasFaltantes} hrs` : `Sobreasignadas: ${Math.abs(horasFaltantes)} hrs`}
                                  </p>
                                )}
                                {errors.horas && <p className="text-red-500 text-xs mt-1">{errors.horas}</p>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Fechas - EDITABLE */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📅 Inicio</label>
                            <input 
                              type="date" 
                              name="fechaInicio" 
                              value={formData.fechaInicio || ''} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📅 Término</label>
                            <input 
                              type="date" 
                              name="fechaTermino" 
                              value={formData.fechaTermino || ''} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                        </div>

                        {/* Contraparte - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🤝 Contraparte</label>
                          <input 
                            type="text" 
                            name="contraparte" 
                            value={formData.contraparte || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            placeholder="Cliente interno/externo" 
                          />
                        </div>

                        {/* Estado y Avance - EDITABLE */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⚡ Estado</label>
                            <select 
                              name="estado" 
                              value={formData.estado || 'No Iniciada'} 
                              onChange={handleInputChange} 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                            >
                              <option value="No Iniciada">No Iniciada</option>
                              <option value="En Curso">En Curso</option>
                              <option value="Standby">Standby</option>
                              <option value="Completada">Completada</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📊 % Avance</label>
                            <input 
                              type="number" 
                              name="avance" 
                              value={formData.avance || 0} 
                              onChange={handleInputChange} 
                              min="0" 
                              max="100" 
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            />
                          </div>
                        </div>

                        {/* HH Real - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">✅ HH Real</label>
                          <input 
                            type="number" 
                            name="hhReal" 
                            value={formData.hhReal || 0} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                          />
                        </div>

                        {/* Alertas - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⚠️ Alertas</label>
                          <textarea 
                            name="alertas" 
                            value={formData.alertas || ''} 
                            onChange={handleInputChange} 
                            rows={2} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            placeholder="Alertas detectadas..." 
                          />
                        </div>

                        {/* Acciones - EDITABLE */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🔧 Acciones</label>
                          <textarea 
                            name="acciones" 
                            value={formData.acciones || ''} 
                            onChange={handleInputChange} 
                            rows={2} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none" 
                            placeholder="Acciones tomadas..." 
                          />
                        </div>

                        {/* Responsable - Select editable */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👤 Responsable</label>
                          <select 
                            name="responsable" 
                            value={formData.responsableId || ''} 
                            onChange={handleInputChange} 
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                          >
                            <option value="">Seleccionar responsable...</option>
                            {profesionalesActivos.map(prof => (
                              <option key={prof.id} value={prof.id}>
                                {prof.nombre} - {prof.cargo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="mt-4 sm:mt-6 flex justify-end space-x-2 sm:space-x-3 pt-4 border-t border-gray-200">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowModal(false);
                          if (location.state?.convertFromSolicitud) {
                            window.history.replaceState({}, document.title);
                          }
                        }} 
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-bold disabled:opacity-50"
                      >
                        {saving ? 'Guardando...' : (modalMode === 'add' ? 'Crear Ficha' : 'Guardar Cambios')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal para seleccionar recursos */}
          {showRecursosSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
                  <h3 className="text-base sm:text-lg font-semibold">👥 Seleccionar Recursos y Asignar Horas</h3>
                  <button onClick={() => setShowRecursosSelector(false)} className="text-white hover:text-gray-300 text-xl">✕</button>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Total horas del proyecto:</span> {horasTotales} hrs
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Asigna las horas individualmente para cada profesional. La suma debe ser igual al total del proyecto.
                    </p>
                    <p className="text-xs text-purple-600 mt-1 font-semibold">
                      Total asignado: {totalHorasAsignadas} hrs | Faltante: {horasFaltantes} hrs
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2 text-sm">Profesionales disponibles</h4>
                      <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto">
                        {profesionalesActivos.filter(p => !tempRecursos.some(r => r.id === p.id)).map(prof => {
                          const horasDisponibles = getHorasDisponibles(prof);
                          return (
                            <div key={prof.id} onClick={() => addRecurso(prof)} className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100">
                              <div className="font-medium text-sm">{prof.nombre}</div>
                              <div className="text-xs text-gray-500">{prof.cargo}</div>
                              <div className="text-xs text-green-600">Horas disponibles: {horasDisponibles} hrs</div>
                            </div>
                          );
                        })}
                        {profesionalesActivos.filter(p => !tempRecursos.some(r => r.id === p.id)).length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-sm">No hay más profesionales disponibles</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2 text-sm">Recursos seleccionados</h4>
                      <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto">
                        {tempRecursos.map(recurso => {
                          const horasDisponibles = recurso.horasDisponibles !== undefined ? recurso.horasDisponibles : 160;
                          return (
                            <div key={recurso.id} className="p-3 bg-purple-50 border-b border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium text-sm">{recurso.nombre}</div>
                                  <div className="text-xs text-gray-500">{recurso.cargo}</div>
                                  <div className="text-xs text-green-600">Disponibles: {horasDisponibles} hrs</div>
                                </div>
                                <button type="button" onClick={() => removeRecurso(recurso.id)} className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                              </div>
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Horas asignadas:</label>
                                <input
                                  type="number"
                                  value={recurso.horasAsignadas || 0}
                                  onChange={(e) => {
                                    const nuevasHoras = parseInt(e.target.value) || 0;
                                    const updatedRecursos = tempRecursos.map(r =>
                                      r.id === recurso.id ? { ...r, horasAsignadas: nuevasHoras } : r
                                    );
                                    setTempRecursos(updatedRecursos);
                                    handleHorasPorRecursoChange(recurso.id, nuevasHoras);
                                  }}
                                  min="0"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 outline-none"
                                />
                                {recurso.horasAsignadas && recurso.horasAsignadas > horasDisponibles && (
                                  <p className="text-xs text-red-500 mt-1">⚠️ Excede las horas disponibles ({horasDisponibles} hrs)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {tempRecursos.length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-sm">No hay recursos seleccionados</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowRecursosSelector(false)} className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded text-gray-700 hover:bg-gray-100">Cancelar</button>
                    <button type="button" onClick={confirmRecursos} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Confirmar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full">
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-t-lg">
                  <h3 className="text-base sm:text-lg font-semibold">🗑️ Confirmar eliminación</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">¿Estás seguro de que deseas eliminar esta ficha? Esto también liberará las horas asignadas a los profesionales.</p>
                  <div className="flex justify-end space-x-2 sm:space-x-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-bold">Cancelar</button>
                    <button onClick={confirmDelete} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 font-bold">Eliminar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Traspasar Ficha a Solicitud */}
          {showModalTraspasoSolicitud && (
            <ModalTraspasoSolicitud
              isOpen={showModalTraspasoSolicitud}
              onClose={() => setShowModalTraspasoSolicitud(false)}
              ficha={fichaParaTraspaso}
              onManual={handleConfirmarManualTraspaso}
            />
          )}
    </div>
  );
};

export default Fichas;