// src/components/SolicitudProyecto.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import emailService from '../services/emailService';

interface SolicitudProyecto {
  id: string;
  token?: string;
  email?: string;
  fechaSolicitud: string;
  
  // DATOS DEL SOLICITANTE (sección 1)
  nombreSolicitante: string;
  area: string;
  gerenteSponsor: string;
  
  // DATOS GENERALES DEL PROYECTO (sección 2)
  nombreProyecto: string;
  objetivoGeneral: string;
  objetivosEspecificos: string;
  coberturaAlcance: string;
  
  // FOCO ESTRATEGICO (sección 3)
  focoEstrategico: string;
  impacto: string;
  
  // SUSTENTO LEGAL (sección 4)
  tieneSustentoLegal: boolean;
  sustentoLegalCual: string;
  
  // REQUISITO DE FECHA (sección 5)
  tieneRequisitoFecha: boolean;
  requisitoFechaCual: string;
  requisitoFechaPorque: string;
  observaciones: string;
  
  // DATOS DEL ÁREA DE TECNOLOGÍA
  nombreResponsableProyecto: string;
  equipo: string;
  
  // DATOS DE LA CONTRAPARTE
  nombreContraparteCliente: string;
  areaContraparte: string;
  nombreJefaturaDirecta: string;
  
  // DESCRIPCIÓN DEL PROYECTO
  descripcionGeneral: string;
  
  // RESTRICCIONES
  presupuesto: number;
  tiempo: string;
  otrasRestricciones: string;
  
  // RIESGOS DEL PROYECTO
  riesgos: string;
  valorDolar: number;
  
  // FECHAS PRELIMINARES
  fechaInicio: string;
  
  // ESTADO DE LA SOLICITUD
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En Revision';
  motivoRechazo?: string;
  fechaAprobacionRechazo?: string;
  completadoPor?: string;
  fechaCompletado?: string;
  esEnvioParcial?: boolean;
  
  // PROFESIONALES ASIGNADOS
  profesionalesAsignados?: { profesionalId: string; profesionalNombre: string; estimacionHoras: number; fechaAsignacion: string }[];
  estimacionHorasTotal?: number;
}

// Sistema de Toast personalizado
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading' | 'warning';
}

// Componente de Toast
const ToastContainer: React.FC<{ toasts: ToastMessage[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.type !== 'loading') {
        const timer = setTimeout(() => onRemove(toast.id), 3000);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] transition-all transform translate-x-0 ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            toast.type === 'loading' ? 'bg-blue-500' : 'bg-gray-500'
          }`}
          style={{ animation: 'slideIn 0.3s ease-out forwards' }}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <span>✅</span>}
            {toast.type === 'error' && <span>❌</span>}
            {toast.type === 'warning' && <span>⚠️</span>}
            {toast.type === 'loading' && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {toast.type === 'info' && <span>ℹ️</span>}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Modal de confirmación de envío
const ModalConfirmacionEnvio: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  email: string;
  link: string;
  nombreProyecto: string;
}> = ({ isOpen, onClose, email, link, nombreProyecto }) => {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const copiarLink = () => {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-green-500">✅</span>
            Solicitud Enviada
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">El formulario ha sido enviado a:</p>
          <p className="font-semibold text-indigo-600 mb-4">{email}</p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2"><strong>Proyecto:</strong> {nombreProyecto}</p>
            <p className="text-sm text-gray-600 mb-2">El destinatario recibirá un link para completar el formulario.</p>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Link temporal:</label>
              <div className="flex gap-2">
                <input type="text" value={link} readOnly className="flex-1 text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1" />
                <button onClick={copiarLink} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                  {copiado ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Entendido</button>
        </div>
      </div>
    </div>
  );
};

// Modal de confirmación de eliminación
const ModalConfirmacionEliminar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombreProyecto: string;
}> = ({ isOpen, onClose, onConfirm, nombreProyecto }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-red-500">⚠️</span> Confirmar Eliminación
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">¿Estás seguro de eliminar la siguiente solicitud?</p>
          <p className="font-semibold text-red-600 mb-4">{nombreProyecto}</p>
          <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
        </div>
      </div>
    </div>
  );
};

// Modal de confirmación de aprobación CON OBSERVACIONES
const ModalConfirmacionAprobar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombreProyecto: string;
  observaciones: string;
  setObservaciones: (value: string) => void;
}> = ({ isOpen, onClose, onConfirm, nombreProyecto, observaciones, setObservaciones }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-green-500">✓</span> Confirmar Aprobación
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">¿Estás seguro de aprobar la siguiente solicitud?</p>
          <p className="font-semibold text-green-600 mb-4">{nombreProyecto}</p>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones / Comentarios
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ingresa observaciones para el solicitante (opcional)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estas observaciones serán enviadas al solicitante por email.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Aprobar</button>
        </div>
      </div>
    </div>
  );
};

// ✅ NUEVO: Modal de Detalles Completos de la Solicitud
const ModalDetallesSolicitud: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  solicitud: SolicitudProyecto | null;
}> = ({ isOpen, onClose, solicitud }) => {
  if (!isOpen || !solicitud) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      case 'En Revision': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">
            📋 Detalles de la Solicitud: {solicitud.nombreProyecto}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Código y Estado */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">Código</span>
                <p className="font-mono font-bold">PROJ-{solicitud.id.slice(-6)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Estado</span>
                <p><span className={`px-3 py-1 text-sm rounded-full ${getEstadoColor(solicitud.estado)}`}>
                  {solicitud.estado === 'En Revision' ? 'En Revisión' : solicitud.estado}
                </span></p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fecha Solicitud</span>
                <p className="font-medium">{solicitud.fechaSolicitud || 'No especificada'}</p>
              </div>
            </div>
          </div>

          {/* Datos del Solicitante */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span className="text-xl">👤</span> 1. DATOS DEL SOLICITANTE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-sm text-gray-500">Nombre Solicitante</span><p className="font-medium">{solicitud.nombreSolicitante || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Área</span><p className="font-medium">{solicitud.area || 'No especificada'}</p></div>
              <div><span className="text-sm text-gray-500">Gerente Sponsor</span><p className="font-medium">{solicitud.gerenteSponsor || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Email de Notificación</span><p className="font-medium">{solicitud.email || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Datos Generales del Proyecto */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span> 2. DATOS GENERALES DEL PROYECTO
            </h3>
            <div className="space-y-2">
              <div><span className="text-sm text-gray-500">Nombre del Proyecto</span><p className="font-medium">{solicitud.nombreProyecto || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Objetivo General</span><p className="font-medium">{solicitud.objetivoGeneral || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Objetivos Específicos</span><p className="font-medium">{solicitud.objetivosEspecificos || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Cobertura y Alcance</span><p className="font-medium">{solicitud.coberturaAlcance || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Foco Estratégico */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span> 3. FOCO ESTRATÉGICO
            </h3>
            <div className="space-y-2">
              <div><span className="text-sm text-gray-500">Foco Estratégico</span><p className="font-medium">{solicitud.focoEstrategico || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Impacto</span><p className="font-medium">{solicitud.impacto || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Sustento Legal y Requisitos */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <span className="text-xl">⚖️</span> 4. SUSTENTO LEGAL Y REQUISITOS
            </h3>
            <div className="space-y-2">
              <div><span className="text-sm text-gray-500">Sustento Legal</span><p className="font-medium">{solicitud.tieneSustentoLegal ? '✅ Sí' : '❌ No'}</p></div>
              {solicitud.tieneSustentoLegal && (
                <div><span className="text-sm text-gray-500">¿Cuál?</span><p className="font-medium">{solicitud.sustentoLegalCual || 'No especificado'}</p></div>
              )}
              <div><span className="text-sm text-gray-500">Requisito de Fecha</span><p className="font-medium">{solicitud.tieneRequisitoFecha ? '✅ Sí' : '❌ No'}</p></div>
              {solicitud.tieneRequisitoFecha && (
                <>
                  <div><span className="text-sm text-gray-500">¿Cuál?</span><p className="font-medium">{solicitud.requisitoFechaCual || 'No especificado'}</p></div>
                  <div><span className="text-sm text-gray-500">¿Por qué?</span><p className="font-medium">{solicitud.requisitoFechaPorque || 'No especificado'}</p></div>
                </>
              )}
              <div><span className="text-sm text-gray-500">Observaciones</span><p className="font-medium">{solicitud.observaciones || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Datos de Tecnología */}
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <span className="text-xl">💻</span> DATOS DEL ÁREA DE TECNOLOGÍA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-sm text-gray-500">Nombre Responsable</span><p className="font-medium">{solicitud.nombreResponsableProyecto || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Equipo</span><p className="font-medium">{solicitud.equipo || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Datos de la Contraparte */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🤝</span> DATOS DE LA CONTRAPARTE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-sm text-gray-500">Contraparte Cliente</span><p className="font-medium">{solicitud.nombreContraparteCliente || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Área Contraparte</span><p className="font-medium">{solicitud.areaContraparte || 'No especificada'}</p></div>
              <div className="md:col-span-2"><span className="text-sm text-gray-500">Jefatura Directa</span><p className="font-medium">{solicitud.nombreJefaturaDirecta || 'No especificado'}</p></div>
            </div>
          </div>

          {/* Descripción y Restricciones */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span> DESCRIPCIÓN Y RESTRICCIONES
            </h3>
            <div className="space-y-2">
              <div><span className="text-sm text-gray-500">Descripción General</span><p className="font-medium">{solicitud.descripcionGeneral || 'No especificado'}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><span className="text-sm text-gray-500">Presupuesto</span><p className="font-medium text-green-600">${solicitud.presupuesto?.toLocaleString() || '0'}</p></div>
                <div><span className="text-sm text-gray-500">Tiempo Estimado</span><p className="font-medium">{solicitud.tiempo || 'No especificado'}</p></div>
                <div><span className="text-sm text-gray-500">Valor Dólar</span><p className="font-medium">${solicitud.valorDolar || '0'}</p></div>
              </div>
              <div><span className="text-sm text-gray-500">Otras Restricciones</span><p className="font-medium">{solicitud.otrasRestricciones || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Riesgos</span><p className="font-medium">{solicitud.riesgos || 'No especificado'}</p></div>
              <div><span className="text-sm text-gray-500">Fecha Inicio</span><p className="font-medium">{solicitud.fechaInicio || 'No especificada'}</p></div>
            </div>
          </div>

          {/* Profesionales Asignados */}
          {solicitud.profesionalesAsignados && solicitud.profesionalesAsignados.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                <span className="text-xl">👨‍💻</span> PROFESIONALES ASIGNADOS
              </h3>
              <div className="space-y-2">
                {solicitud.profesionalesAsignados.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-purple-100 pb-2">
                    <span className="font-medium">{p.profesionalNombre}</span>
                    <span className="text-sm text-gray-600">{p.estimacionHoras} horas</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold">
                  <span>Total Horas</span>
                  <span>{solicitud.estimacionHorasTotal || 0} horas</span>
                </div>
              </div>
            </div>
          )}

          {/* Motivo de Rechazo si existe */}
          {solicitud.motivoRechazo && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                <span className="text-xl">❌</span> MOTIVO DE RECHAZO
              </h3>
              <p className="font-medium">{solicitud.motivoRechazo}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SolicitudProyecto: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [solicitudes, setSolicitudes] = useState<SolicitudProyecto[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'Todas' | 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En Revision'>('Todas');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mostrarModalEmailSimple, setMostrarModalEmailSimple] = useState(false);
  const [mostrarModalConfirmacionEnvio, setMostrarModalConfirmacionEnvio] = useState(false);
  const [mostrarModalConfirmacionEliminar, setMostrarModalConfirmacionEliminar] = useState<{show: boolean; id: string; nombre: string}>({show: false, id: '', nombre: ''});
  const [mostrarModalConfirmacionAprobar, setMostrarModalConfirmacionAprobar] = useState<{show: boolean; id: string; nombre: string}>({show: false, id: '', nombre: ''});
  const [observacionesAprobacion, setObservacionesAprobacion] = useState('');
  const [ultimoEnvio, setUltimoEnvio] = useState<{email: string; link: string; nombre: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSimpleData, setEmailSimpleData] = useState({
    nombreSolicitante: '',
    area: '',
    nombreProyecto: '',
    emailDestinatario: ''
  });

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudProyecto | null>(null);

  const [formData, setFormData] = useState<Partial<SolicitudProyecto>>({
    estado: 'Pendiente',
    tieneSustentoLegal: false,
    tieneRequisitoFecha: false,
    fechaSolicitud: new Date().toISOString().split('T')[0],
    profesionalesAsignados: [],
    estimacionHorasTotal: 0
  });

  // Funciones de Toast
  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    if (type !== 'loading') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }
    return id;
  };

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Generar token
  const generateFormToken = (): string => {
    return 'TOKEN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  };

  // ✅ FUNCIÓN MEJORADA: Cargar solicitudes desde la API
  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando solicitudes desde el servidor...');
      
      const response = await api.get('/solicitudes');
      
      if (response.data.success) {
        const datos = response.data.data || [];
        console.log('📋 Solicitudes recibidas del servidor:', datos.length);
        
        // ✅ Mostrar los datos completos en consola para verificar
        datos.forEach((s: SolicitudProyecto) => {
          console.log(`📝 Solicitud ${s.id}:`, {
            nombreProyecto: s.nombreProyecto,
            nombreSolicitante: s.nombreSolicitante,
            objetivoGeneral: s.objetivoGeneral ? `✅ ${s.objetivoGeneral.substring(0, 30)}...` : '❌ VACÍO',
            descripcionGeneral: s.descripcionGeneral ? `✅ ${s.descripcionGeneral.substring(0, 30)}...` : '❌ VACÍO',
            presupuesto: s.presupuesto,
            tieneDatos: !!s.objetivoGeneral && !!s.descripcionGeneral
          });
        });
        
        setSolicitudes(datos);
        console.log('✅ Estado actualizado con', datos.length, 'solicitudes');
      }
    } catch (err: any) {
      console.error('❌ Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA RECARGAR SIN MOSTRAR LOADING
  const recargarSolicitudesSinLoading = async () => {
    try {
      console.log('🔄 Recargando solicitudes sin loading...');
      const response = await api.get('/solicitudes');
      
      if (response.data.success) {
        const datos = response.data.data || [];
        console.log('📋 Solicitudes recargadas:', datos.length);
        
        // ✅ Mostrar los datos completos en consola para verificar
        datos.forEach((s: SolicitudProyecto) => {
          console.log(`📝 Solicitud ${s.id}:`, {
            nombreProyecto: s.nombreProyecto,
            objetivoGeneral: s.objetivoGeneral ? `✅ ${s.objetivoGeneral.substring(0, 30)}...` : '❌ VACÍO',
            descripcionGeneral: s.descripcionGeneral ? `✅ ${s.descripcionGeneral.substring(0, 30)}...` : '❌ VACÍO',
          });
        });
        
        setSolicitudes(datos);
        console.log('✅ Estado actualizado con', datos.length, 'solicitudes');
      }
    } catch (err: any) {
      console.error('❌ Error recargando solicitudes:', err);
    }
  };

  // ✅ useEffect mejorado para escuchar cambios
  useEffect(() => {
    console.log('🚀 Inicializando SolicitudProyecto...');
    cargarSolicitudes();
    
    const handleSolicitudesUpdate = () => {
      console.log('🔔 Evento "solicitudes-updated" recibido!');
      recargarSolicitudesSinLoading();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'solicitudes-need-refresh') {
        console.log('🔔 Cambio detectado en localStorage!');
        recargarSolicitudesSinLoading();
        try {
          localStorage.removeItem('solicitudes-need-refresh');
        } catch (error) {
          console.warn('No se pudo limpiar localStorage:', error);
        }
      }
    };
    
    // ✅ Escuchar cambios en la visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔔 Pestaña visible, recargando datos...');
        recargarSolicitudesSinLoading();
      }
    };
    
    window.addEventListener('solicitudes-updated', handleSolicitudesUpdate);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('🧹 Limpiando listeners...');
      window.removeEventListener('solicitudes-updated', handleSolicitudesUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ✅ useEffect para convertir Ficha de Proyecto a Solicitud
  useEffect(() => {
    if (location.state && location.state.convertFromFicha) {
      const ficha = location.state.convertFromFicha;
      console.log('📝 Convirtiendo Ficha de Proyecto a Solicitud de Proyecto:', ficha);

      setEditingId(null);
      setFormData({
        nombreProyecto: ficha.nombreProyecto || '',
        nombreSolicitante: ficha.contraparte || ficha.cliente || '',
        area: ficha.cliente || '',
        nombreContraparteCliente: ficha.contraparte || ficha.cliente || '',
        nombreResponsableProyecto: ficha.responsable || ficha.lider || '',
        descripcionGeneral: ficha.descripcion || '',
        presupuesto: ficha.venta || 0,
        fechaInicio: ficha.fechaInicio || new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        tieneSustentoLegal: false,
        tieneRequisitoFecha: false,
        fechaSolicitud: new Date().toISOString().split('T')[0],
        observaciones: `Traspasado desde Ficha de Proyecto (Código: ${ficha.codigo || ''})`
      });
      setMostrarFormulario(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);



  const handleVerDetalles = (solicitud: SolicitudProyecto) => {
    console.log('🔍 Ver detalles de solicitud:', solicitud.id);
    console.log('📝 Datos de la solicitud:', solicitud);
    setSolicitudSeleccionada(solicitud);
    setMostrarModalDetalles(true);
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const response = await api.put(`/solicitudes/${editingId}`, formData);
        if (response.data.success) {
          showToast('Solicitud actualizada exitosamente', 'success');
          setEditingId(null);
          await cargarSolicitudes();
        }
      } else {
        const nuevaSolicitud = {
          ...formData,
          fechaSolicitud: new Date().toISOString().split('T')[0],
          estado: 'Pendiente',
          profesionalesAsignados: [],
          estimacionHorasTotal: 0
        };
        const response = await api.post('/solicitudes', nuevaSolicitud);
        if (response.data.success) {
          showToast('Solicitud creada exitosamente', 'success');
          await cargarSolicitudes();
          
          if (nuevaSolicitud.email) {
            try {
              const emailResult = await emailService.sendConfirmacionRegistro(
                nuevaSolicitud.email,
                nuevaSolicitud.nombreProyecto || 'Proyecto sin nombre',
                nuevaSolicitud.nombreSolicitante || 'Solicitante',
                nuevaSolicitud.area || 'Área no especificada',
                nuevaSolicitud.descripcionGeneral || 'Sin descripción',
                nuevaSolicitud.presupuesto || 0
              );
              
              if (emailResult.success) {
                showToast('Email de confirmación enviado', 'success');
              } else {
                console.warn('⚠️ Error enviando email:', emailResult.message);
                showToast('Solicitud creada, pero no se pudo enviar el email', 'warning');
              }
            } catch (errEmail) {
              console.error('Error enviando email:', errEmail);
              showToast('Solicitud creada, pero no se pudo enviar el email', 'warning');
            }
          }
        }
      }
      setMostrarFormulario(false);
      setFormData({ 
        estado: 'Pendiente', 
        tieneSustentoLegal: false, 
        tieneRequisitoFecha: false, 
        fechaSolicitud: new Date().toISOString().split('T')[0],
        profesionalesAsignados: [],
        estimacionHorasTotal: 0
      });
    } catch (err: any) {
      console.error('❌ Error guardando solicitud:', err);
      showToast(err.response?.data?.message || 'Error al guardar solicitud', 'error');
    }
  };

  const handleEnviarEmailSimple = async () => {
    if (!emailSimpleData.nombreSolicitante || !emailSimpleData.area || 
        !emailSimpleData.nombreProyecto || !emailSimpleData.emailDestinatario) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSimpleData.emailDestinatario)) {
      showToast('Por favor ingresa un email válido', 'error');
      return;
    }

    const loadingId = showToast('Creando solicitud y enviando email...', 'loading');

    try {
      const token = generateFormToken();
      console.log('🔑 Token generado:', token);

      const nuevaSolicitud: any = {
        token: token,
        email: emailSimpleData.emailDestinatario,
        nombreSolicitante: emailSimpleData.nombreSolicitante,
        area: emailSimpleData.area,
        nombreProyecto: emailSimpleData.nombreProyecto,
        estado: 'En Revision',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        esEnvioParcial: true,
        profesionalesAsignados: [],
        estimacionHorasTotal: 0
      };

      const response = await api.post('/solicitudes', nuevaSolicitud);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al crear la solicitud');
      }

      console.log('💾 Solicitud guardada exitosamente');

      const link = `${window.location.origin}/formulario-solicitud/${token}`;
      console.log('🔗 Link generado:', link);

      const emailResult = await emailService.sendFormularioEmail(
        emailSimpleData.emailDestinatario,
        emailSimpleData.nombreProyecto,
        emailSimpleData.nombreSolicitante,
        emailSimpleData.area,
        link
      );

      dismissToast(loadingId);

      if (emailResult.success) {
        setUltimoEnvio({
          email: emailSimpleData.emailDestinatario,
          link: link,
          nombre: emailSimpleData.nombreProyecto
        });
        setMostrarModalConfirmacionEnvio(true);
        setMostrarModalEmailSimple(false);
        setEmailSimpleData({ nombreSolicitante: '', area: '', nombreProyecto: '', emailDestinatario: '' });
        showToast(`✅ Solicitud creada y email enviado exitosamente`, 'success');
        await cargarSolicitudes();
      } else {
        showToast(`⚠️ Solicitud creada pero el email no pudo enviarse: ${emailResult.message}`, 'warning');
        await cargarSolicitudes();
      }

    } catch (error: any) {
      console.error('❌ Error en handleEnviarEmailSimple:', error);
      dismissToast(loadingId);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la solicitud';
      showToast(`❌ ${errorMessage}`, 'error');
    }
  };

  const handleEdit = (solicitud: SolicitudProyecto) => {
    console.log('📝 Editando solicitud:', solicitud.id);
    setFormData({
      ...solicitud,
      tieneSustentoLegal: solicitud.tieneSustentoLegal || false,
      tieneRequisitoFecha: solicitud.tieneRequisitoFecha || false,
    });
    setEditingId(solicitud.id);
    setMostrarFormulario(true);
  };

  const handleDeleteConfirm = (id: string, nombre: string) => {
    setMostrarModalConfirmacionEliminar({ show: true, id, nombre });
  };

  const handleDelete = async () => {
    const { id } = mostrarModalConfirmacionEliminar;
    try {
      const response = await api.delete(`/solicitudes/${id}`);
      if (response.data.success) {
        showToast('Solicitud eliminada exitosamente', 'success');
        await cargarSolicitudes();
      }
    } catch (err: any) {
      console.error('❌ Error eliminando solicitud:', err);
      showToast(err.response?.data?.message || 'Error al eliminar solicitud', 'error');
    }
    setMostrarModalConfirmacionEliminar({ show: false, id: '', nombre: '' });
  };

  const handleAprobarConfirm = (id: string, nombre: string) => {
    setMostrarModalConfirmacionAprobar({ show: true, id, nombre });
    setObservacionesAprobacion('');
  };

  const handleAprobar = async () => {
    const { id } = mostrarModalConfirmacionAprobar;
    
    if (!id) {
      showToast('Error: No se encontró la solicitud', 'error');
      return;
    }

    const loadingId = showToast('Procesando aprobación...', 'loading');
    
    try {
      const payload = {
        completadoPor: 'admin',
        observaciones: observacionesAprobacion || 'Sin observaciones adicionales'
      };
      
      console.log('📤 Enviando aprobación para solicitud:', id);
      
      const response = await api.post(`/solicitudes/${id}/aprobar`, payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al aprobar la solicitud');
      }

      const reqDetail = solicitudes.find(s => s.id === id);
      
      if (reqDetail && reqDetail.email) {
        try {
          const emailResult = await emailService.sendAprobacionNotification(
            reqDetail.email,
            reqDetail.nombreProyecto,
            reqDetail.nombreSolicitante,
            observacionesAprobacion || 'El proyecto ha sido aprobado para su ejecución.'
          );
          
          if (emailResult.success) {
            console.log('✅ Notificación de aprobación enviada por email');
            showToast('Solicitud aprobada y notificación enviada', 'success');
          } else {
            console.warn('⚠️ Solicitud aprobada pero no se pudo enviar el email:', emailResult.message);
            showToast('Solicitud aprobada, pero no se pudo enviar la notificación', 'warning');
          }
        } catch (emailError) {
          console.error('Error enviando email de aprobación:', emailError);
          showToast('Solicitud aprobada, pero error al enviar notificación', 'warning');
        }
      } else {
        showToast('Solicitud aprobada exitosamente', 'success');
      }

      dismissToast(loadingId);
      setMostrarModalConfirmacionAprobar({ show: false, id: '', nombre: '' });
      setObservacionesAprobacion('');
      await cargarSolicitudes();
      
      if (reqDetail) {
        navigate('/fichas', { state: { convertFromSolicitud: reqDetail } });
      }
      
    } catch (error: any) {
      console.error('❌ Error aprobando solicitud:', error);
      dismissToast(loadingId);
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Error al aprobar solicitud';
      showToast(`❌ ${errorMessage}`, 'error');
    }
  };

  const handleRechazar = async (id: string) => {
    if (!motivoRechazo.trim()) {
      showToast('Debes ingresar un motivo de rechazo', 'error');
      return;
    }

    const loadingId = showToast('Procesando rechazo...', 'loading');
    
    try {
      const payload = {
        motivoRechazo: motivoRechazo.trim(),
        completadoPor: 'admin'
      };
      
      console.log('📤 Enviando rechazo para solicitud:', id);
      
      const response = await api.post(`/solicitudes/${id}/rechazar`, payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al rechazar la solicitud');
      }

      const reqDetail = solicitudes.find(s => s.id === id);
      
      if (reqDetail && reqDetail.email) {
        try {
          const emailResult = await emailService.sendRechazoNotification(
            reqDetail.email,
            reqDetail.nombreProyecto,
            reqDetail.nombreSolicitante,
            motivoRechazo.trim(),
            ''
          );
          
          if (emailResult.success) {
            console.log('✅ Notificación de rechazo enviada por email');
            showToast('Solicitud rechazada y notificación enviada', 'success');
          } else {
            console.warn('⚠️ Solicitud rechazada pero no se pudo enviar el email:', emailResult.message);
            showToast('Solicitud rechazada, pero no se pudo enviar la notificación', 'warning');
          }
        } catch (emailError) {
          console.error('Error enviando email de rechazo:', emailError);
          showToast('Solicitud rechazada, pero error al enviar notificación', 'warning');
        }
      } else {
        showToast('Solicitud rechazada exitosamente', 'success');
      }

      dismissToast(loadingId);
      setMostrarModalRechazo(null);
      setMotivoRechazo('');
      await cargarSolicitudes();
      
    } catch (error: any) {
      console.error('❌ Error rechazando solicitud:', error);
      dismissToast(loadingId);
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Error al rechazar solicitud';
      showToast(`❌ ${errorMessage}`, 'error');
    }
  };

  const solicitudesFiltradas = filtroEstado === 'Todas' ? solicitudes : solicitudes.filter(sol => sol.estado === filtroEstado);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      case 'En Revision': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading && solicitudes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <ToastContainer toasts={toasts} onRemove={dismissToast} />
      
      <ModalDetallesSolicitud
        isOpen={mostrarModalDetalles}
        onClose={() => setMostrarModalDetalles(false)}
        solicitud={solicitudSeleccionada}
      />
      
      <ModalConfirmacionEnvio
        isOpen={mostrarModalConfirmacionEnvio}
        onClose={() => setMostrarModalConfirmacionEnvio(false)}
        email={ultimoEnvio?.email || ''}
        link={ultimoEnvio?.link || ''}
        nombreProyecto={ultimoEnvio?.nombre || ''}
      />
      
      <ModalConfirmacionEliminar
        isOpen={mostrarModalConfirmacionEliminar.show}
        onClose={() => setMostrarModalConfirmacionEliminar({ show: false, id: '', nombre: '' })}
        onConfirm={handleDelete}
        nombreProyecto={mostrarModalConfirmacionEliminar.nombre}
      />
      
      <ModalConfirmacionAprobar
        isOpen={mostrarModalConfirmacionAprobar.show}
        onClose={() => {
          setMostrarModalConfirmacionAprobar({ show: false, id: '', nombre: '' });
          setObservacionesAprobacion('');
        }}
        onConfirm={handleAprobar}
        nombreProyecto={mostrarModalConfirmacionAprobar.nombre}
        observaciones={observacionesAprobacion}
        setObservaciones={setObservacionesAprobacion}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Solicitudes de Proyecto</h1>
            <p className="text-gray-600 mt-1">Gestión de solicitudes basadas en formato RPA</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </button>
            <button
              onClick={() => setMostrarModalEmailSimple(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Enviar por Email
            </button>
            <button
              onClick={() => { setEditingId(null); setFormData({ estado: 'Pendiente', tieneSustentoLegal: false, tieneRequisitoFecha: false, fechaSolicitud: new Date().toISOString().split('T')[0], profesionalesAsignados: [], estimacionHorasTotal: 0 }); setMostrarFormulario(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nueva Solicitud
            </button>
          </div>
        </div>



        {/* Modal de envío por email */}
        {mostrarModalEmailSimple && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Enviar Solicitud por Email</h3>
                <button onClick={() => setMostrarModalEmailSimple(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">Complete los datos básicos para enviar el formulario.</p>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Solicitante *</label>
                    <input type="text" value={emailSimpleData.nombreSolicitante} onChange={(e) => setEmailSimpleData({...emailSimpleData, nombreSolicitante: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                    <input type="text" value={emailSimpleData.area} onChange={(e) => setEmailSimpleData({...emailSimpleData, area: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
                    <input type="text" value={emailSimpleData.nombreProyecto} onChange={(e) => setEmailSimpleData({...emailSimpleData, nombreProyecto: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Correo del Destinatario *</label>
                    <input type="email" value={emailSimpleData.emailDestinatario} onChange={(e) => setEmailSimpleData({...emailSimpleData, emailDestinatario: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setMostrarModalEmailSimple(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancelar</button>
                <button onClick={handleEnviarEmailSimple} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">Enviar Email</button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFiltroEstado('Todas')} className={`px-4 py-2 rounded-lg ${filtroEstado === 'Todas' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Todas ({solicitudes.length})</button>
            <button onClick={() => setFiltroEstado('Pendiente')} className={`px-4 py-2 rounded-lg ${filtroEstado === 'Pendiente' ? 'bg-yellow-500 text-white' : 'bg-yellow-100'}`}>Pendientes ({solicitudes.filter(s => s.estado === 'Pendiente').length})</button>
            <button onClick={() => setFiltroEstado('En Revision')} className={`px-4 py-2 rounded-lg ${filtroEstado === 'En Revision' ? 'bg-blue-500 text-white' : 'bg-blue-100'}`}>En Revisión ({solicitudes.filter(s => s.estado === 'En Revision').length})</button>
            <button onClick={() => setFiltroEstado('Aprobado')} className={`px-4 py-2 rounded-lg ${filtroEstado === 'Aprobado' ? 'bg-green-600 text-white' : 'bg-green-100'}`}>Aprobadas ({solicitudes.filter(s => s.estado === 'Aprobado').length})</button>
            <button onClick={() => setFiltroEstado('Rechazado')} className={`px-4 py-2 rounded-lg ${filtroEstado === 'Rechazado' ? 'bg-red-600 text-white' : 'bg-red-100'}`}>Rechazadas ({solicitudes.filter(s => s.estado === 'Rechazado').length})</button>
          </div>
        </div>

        {/* Modal de formulario completo */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Solicitud' : 'Nueva Solicitud de Proyecto'}</h2>
                <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* Sección 1: DATOS DEL SOLICITANTE */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-4">1. DATOS DEL SOLICITANTE (*)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Nombre Solicitante *</label><input type="text" name="nombreSolicitante" value={formData.nombreSolicitante || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Área *</label><input type="text" name="area" value={formData.area || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Gerente Sponsor</label><input type="text" name="gerenteSponsor" value={formData.gerenteSponsor || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Email de Notificación</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="ejemplo@correo.com" /></div>
                  </div>
                </div>

                {/* Sección 2: DATOS GENERALES DEL PROYECTO */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-4">2. DATOS GENERALES DEL PROYECTO</h3>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Nombre del Proyecto *</label><input type="text" name="nombreProyecto" value={formData.nombreProyecto || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Objetivo General</label><textarea name="objetivoGeneral" value={formData.objetivoGeneral || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Objetivos Específicos</label><textarea name="objetivosEspecificos" value={formData.objetivosEspecificos || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Cobertura y Alcance</label><textarea name="coberturaAlcance" value={formData.coberturaAlcance || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                {/* Sección 3: FOCO ESTRATÉGICO */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-800 mb-4">3. FOCO ESTRATÉGICO</h3>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Foco Estratégico</label><textarea name="focoEstrategico" value={formData.focoEstrategico || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Impacto</label><textarea name="impacto" value={formData.impacto || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                {/* Sección 4: SUSTENTO LEGAL Y REQUISITOS */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-yellow-800 mb-4">4. SUSTENTO LEGAL Y REQUISITOS</h3>
                  <div className="space-y-4">
                    <div><label className="flex items-center gap-2"><input type="checkbox" name="tieneSustentoLegal" checked={formData.tieneSustentoLegal || false} onChange={handleChange} /><span className="text-sm">¿Existe sustento legal?</span></label>{formData.tieneSustentoLegal && <input type="text" name="sustentoLegalCual" value={formData.sustentoLegalCual || ''} onChange={handleChange} placeholder="¿Cuál?" className="mt-2 w-full px-3 py-2 border rounded-md" />}</div>
                    <div><label className="flex items-center gap-2"><input type="checkbox" name="tieneRequisitoFecha" checked={formData.tieneRequisitoFecha || false} onChange={handleChange} /><span className="text-sm">¿Existe requisito de fecha?</span></label>{formData.tieneRequisitoFecha && (<div className="mt-2 space-y-2"><input type="text" name="requisitoFechaCual" value={formData.requisitoFechaCual || ''} onChange={handleChange} placeholder="¿Cuál?" className="w-full px-3 py-2 border rounded-md" /><input type="text" name="requisitoFechaPorque" value={formData.requisitoFechaPorque || ''} onChange={handleChange} placeholder="¿Por qué?" className="w-full px-3 py-2 border rounded-md" /></div>)}</div>
                    <div><label className="block text-sm font-medium text-gray-700">Observaciones</label><textarea name="observaciones" value={formData.observaciones || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                {/* DATOS DEL ÁREA DE TECNOLOGÍA */}
                <div className="bg-pink-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-pink-800 mb-4">DATOS DEL ÁREA DE TECNOLOGÍA (**)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Nombre Responsable</label><input type="text" name="nombreResponsableProyecto" value={formData.nombreResponsableProyecto || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Equipo</label><input type="text" name="equipo" value={formData.equipo || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                {/* DATOS DE LA CONTRAPARTE */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-indigo-800 mb-4">DATOS DE LA CONTRAPARTE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Nombre Contraparte Cliente</label><input type="text" name="nombreContraparteCliente" value={formData.nombreContraparteCliente || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Área</label><input type="text" name="areaContraparte" value={formData.areaContraparte || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Jefatura Directa</label><input type="text" name="nombreJefaturaDirecta" value={formData.nombreJefaturaDirecta || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                {/* DESCRIPCIÓN Y RESTRICCIONES */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange-800 mb-4">DESCRIPCIÓN Y RESTRICCIONES</h3>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Descripción General</label><textarea name="descripcionGeneral" value={formData.descripcionGeneral || ''} onChange={handleChange} rows={3} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700">Presupuesto (USD)</label><input type="number" name="presupuesto" value={formData.presupuesto || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Tiempo Estimado</label><input type="text" name="tiempo" value={formData.tiempo || ''} onChange={handleChange} placeholder="Ej: 3 meses" className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Valor Dólar</label><input type="number" step="0.01" name="valorDolar" value={formData.valorDolar || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Otras Restricciones</label><textarea name="otrasRestricciones" value={formData.otrasRestricciones || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Riesgos</label><textarea name="riesgos" value={formData.riesgos || ''} onChange={handleChange} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Fecha Inicio</label><input type="date" name="fechaInicio" value={formData.fechaInicio || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" /></div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarFormulario(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? 'Actualizar' : 'Guardar Solicitud'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de rechazo con observaciones */}
        {mostrarModalRechazo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rechazar Solicitud</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de Rechazo *
                </label>
                <textarea 
                  value={motivoRechazo} 
                  onChange={(e) => setMotivoRechazo(e.target.value)} 
                  rows={4} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                  placeholder="Ingresa el motivo del rechazo..."
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este motivo será enviado al solicitante por email.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button onClick={() => setMostrarModalRechazo(null)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button onClick={() => handleRechazar(mostrarModalRechazo)} className="px-4 py-2 bg-red-600 text-white rounded-md">Rechazar</button>
              </div>
            </div>
          </div>
        )}

        {/* TABLA DE SOLICITUDES */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="mt-2 text-gray-500">No hay solicitudes</p>
              <button onClick={() => setMostrarFormulario(true)} className="mt-4 text-indigo-600 hover:text-indigo-800">Crear primera solicitud</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profesionales Asignados</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudesFiltradas.map((solicitud, index) => (
                    <tr key={`${solicitud.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">PROJ-{solicitud.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{solicitud.nombreProyecto}{solicitud.esEnvioParcial && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">Pendiente</span>}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.nombreSolicitante}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.area}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.fechaSolicitud}</td>
                      <td className="px-6 py-4 text-center">
                        {solicitud.profesionalesAsignados && solicitud.profesionalesAsignados.length > 0 ? (
                          <div className="text-xs">
                            <span className="font-semibold text-purple-600">{solicitud.profesionalesAsignados.length} profesional(es)</span>
                            <div className="text-gray-500">
                              {solicitud.profesionalesAsignados.map(p => p.profesionalNombre).join(', ')}
                            </div>
                            <div className="text-blue-600">
                              Total: {solicitud.estimacionHorasTotal || 0} hrs
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(solicitud.estado)}`}>{solicitud.estado === 'En Revision' ? 'En Revisión' : solicitud.estado}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleVerDetalles(solicitud)} 
                            className="text-blue-600 hover:text-blue-800 p-1" 
                            title="Ver Detalles Completos"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button onClick={() => handleEdit(solicitud)} className="text-indigo-600 hover:text-indigo-800 p-1" title="Editar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          {(solicitud.estado === 'Pendiente' || solicitud.estado === 'En Revision') && (
                            <>
                              <button onClick={() => handleAprobarConfirm(solicitud.id, solicitud.nombreProyecto)} className="text-green-600 hover:text-green-800 p-1" title="Aprobar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                              <button onClick={() => setMostrarModalRechazo(solicitud.id)} className="text-red-600 hover:text-red-800 p-1" title="Rechazar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </>
                          )}
                          <button onClick={() => handleDeleteConfirm(solicitud.id, solicitud.nombreProyecto)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nota del documento */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">(*) Debe ser completado por el área y usuario que solicita el proyecto<br />(**) Debe ser completado por el área de tecnología, ya sea que el proyecto sea Aceptado o Rechazado para su ejecución.<br />De ser aceptada la ejecución del proyecto por parte del Comité, tanto la contraparte usuaria como el Gerente Sponsor deberán comprometerse a participar en las distintas instancias del proyecto, entre estas las revisiones semanales de avance.</p>
        </div>
      </div>
    </div>
  );
};

export default SolicitudProyecto;