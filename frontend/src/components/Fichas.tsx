import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../services/api';
import FichasProspecto from './FichasProspecto';

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

const Fichas: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'proyectos' | 'prospectos'>('proyectos');
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [filteredFichas, setFilteredFichas] = useState<Ficha[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
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
  
  // ✅ Nuevo estado para forzar recreación del modal
  const [modalKey, setModalKey] = useState(0);

  const [formData, setFormData] = useState({
    codigo: '',
    nombreProyecto: '',
    cliente: '',
    lider: '',
    liderId: '',
    descripcion: '',
    tecnologias: '',
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

  // ✅ CORREGIDO: useEffect para convertir solicitud a ficha
  useEffect(() => {
    if (location.state && location.state.convertFromSolicitud && profesionales.length > 0) {
      const solicitud = location.state.convertFromSolicitud;
      console.log('📝 Convirtiendo solicitud a ficha:', solicitud);
      
      // Buscar el profesional responsable
      const profResponsable = profesionales.find(p => 
        p.nombre?.toLowerCase() === (solicitud.nombreResponsableProyecto || '').toLowerCase()
      );
      
      // Formatear fecha correctamente (YYYY-MM-DD)
      const fechaInicio = solicitud.fechaInicio 
        ? solicitud.fechaInicio.split('T')[0] 
        : '';
      
      // Limpiar estado anterior
      setErrors({});
      setTempRecursos([]);
      setModalMode('add');
      
      const extractedCode = extractCodigoFromObservaciones(solicitud.observaciones || '');

      // Establecer los datos del formulario
      setFormData({
        codigo: extractedCode || generateCodigo(solicitud.nombreProyecto || ''),
        nombreProyecto: solicitud.nombreProyecto || '',
        cliente: solicitud.nombreContraparteCliente || solicitud.area || '',
        lider: '',
        liderId: '',
        descripcion: `Solicitud de proyecto aprobada.\nObjetivo: ${solicitud.objetivoGeneral || ''}\nPresupuesto: $${solicitud.presupuesto || 0}\nResponsable: ${solicitud.nombreResponsableProyecto || ''}`,
        tecnologias: '',
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
      
      // ✅ Incrementar la key para forzar recreación del modal
      setModalKey(prev => prev + 1);
      
      // ✅ Mostrar el modal con un pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      // Limpiar el estado de navegación de forma segura con React Router
      navigate(location.pathname, { replace: true, state: {} });
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

  useEffect(() => {
    loadProfesionales();
    loadFichas();
    loadHorasAsignadas();
    loadClientes();

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
    
    // Si es nombreProyecto y estamos en modo add, generar código automáticamente
    if (name === 'nombreProyecto' && modalMode === 'add') {
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
    setFormData({
      codigo: '',
      nombreProyecto: '',
      cliente: '',
      lider: '',
      liderId: '',
      descripcion: '',
      tecnologias: '',
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

  const handleConvertToProject = (prospecto: any) => {
    navigate('/solicitud-proyecto', { state: { convertFromProspecto: prospecto } });
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
                <span className="hidden xs:inline">Volver</span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">Gestión Fichas</span>
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

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('proyectos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'proyectos'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fichas de Proyectos
            </button>
            <button
              onClick={() => setActiveTab('prospectos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'prospectos'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prospectos de Proyectos
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'prospectos' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <FichasProspecto onConvertToProject={handleConvertToProject} />
        </div>
      ) : (
        <>
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={handleAdd} className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-md border border-green-700">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden xs:inline">Nuevo</span>
                  <span className="xs:hidden">+</span>
                </button>
                <button onClick={exportToExcel} className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm font-medium rounded-md border border-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden xs:inline">Excel</span>
                  <span className="xs:hidden">📊</span>
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
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(ficha)} className="text-purple-600 hover:text-purple-800 p-1" title="Editar">✏️</button>
                              <button onClick={() => handleDelete(ficha.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-400">No hay fichas</td>
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
                      ? (location.state?.convertFromSolicitud ? '📝 Convertir Solicitud a Ficha' : '➕ Nueva Ficha')
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
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
        </>
      )}
    </div>
  );
};

export default Fichas;