// src/components/PublicSolicitudForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import emailService from '../services/emailService';

interface SolicitudProyecto {
  id: string;
  token: string;
  fechaSolicitud: string;
  nombreSolicitante: string;
  area: string;
  gerenteSponsor: string;
  nombreProyecto: string;
  objetivoGeneral: string;
  objetivosEspecificos: string;
  coberturaAlcance: string;
  focoEstrategico: string;
  impacto: string;
  tieneSustentoLegal: boolean;
  sustentoLegalCual: string;
  tieneRequisitoFecha: boolean;
  requisitoFechaCual: string;
  requisitoFechaPorque: string;
  observaciones: string;
  nombreResponsableProyecto: string;
  equipo: string;
  nombreContraparteCliente: string;
  areaContraparte: string;
  nombreJefaturaDirecta: string;
  descripcionGeneral: string;
  presupuesto: number;
  tiempo: string;
  otrasRestricciones: string;
  riesgos: string;
  valorDolar: number;
  fechaInicio: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En Revision';
  completadoPor?: string;
  fechaCompletado?: string;
  esEnvioParcial?: boolean;
  email?: string;
}

// Toast personalizado
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading' | 'warning';
}

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.type !== 'loading') {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
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

const PublicSolicitudForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [formData, setFormData] = useState<Partial<SolicitudProyecto>>({
    tieneSustentoLegal: false,
    tieneRequisitoFecha: false,
  });

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    if (type !== 'loading') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }
    return id;
  };

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    console.log('🔍 Token recibido en URL:', token);
    
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }
    
    const cargarSolicitud = async () => {
      try {
        const response = await api.get(`/solicitudes/token/${token}`);
        
        if (response.data.success && response.data.data) {
          const solicitud = response.data.data;
          console.log('✅ Solicitud encontrada:', solicitud);
          setSolicitudId(solicitud.id);
          setFormData({
            ...solicitud,
            tieneSustentoLegal: solicitud.tieneSustentoLegal || false,
            tieneRequisitoFecha: solicitud.tieneRequisitoFecha || false,
          });
        } else {
          console.log('❌ No se encontró solicitud con token:', token);
          setError('El enlace no es válido o ya expiró. Por favor, contacta al equipo que te envió este formulario.');
        }
      } catch (err: any) {
        console.error('❌ Error cargando solicitud:', err);
        setError(err.response?.data?.message || 'Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };

    cargarSolicitud();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Enviando formulario completo para solicitud ID:', solicitudId);
    
    if (!solicitudId) {
      setError('Error: No se encontró la solicitud');
      return;
    }

    if (!formData.nombreSolicitante?.trim()) {
      showToast('El nombre del solicitante es requerido', 'error');
      return;
    }
    if (!formData.area?.trim()) {
      showToast('El área es requerida', 'error');
      return;
    }
    if (!formData.nombreProyecto?.trim()) {
      showToast('El nombre del proyecto es requerido', 'error');
      return;
    }

    const loadingId = showToast('Guardando formulario...', 'loading');

    try {
      const datosCompletos = {
        ...formData,
        estado: 'En Revision',
        esEnvioParcial: false,
        completadoPor: 'solicitante',
        fechaCompletado: new Date().toISOString().split('T')[0],
      };

      console.log('📤 Enviando datos completos:', datosCompletos);

      const response = await api.put(`/solicitudes/${solicitudId}`, datosCompletos);

      console.log('📥 Respuesta del servidor:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al guardar el formulario');
      }

      if (response.data.data) {
        setFormData(response.data.data);
        console.log('✅ Datos actualizados recibidos:', response.data.data);
      }

      console.log('✅ Formulario guardado exitosamente');
      
      // Disparar evento para actualizar dashboard
      window.dispatchEvent(new Event('solicitudes-updated'));
      console.log('📡 Evento "solicitudes-updated" disparado');
      
      setTimeout(() => {
        window.dispatchEvent(new Event('solicitudes-updated'));
        console.log('📡 Evento "solicitudes-updated" disparado (2)');
      }, 500);

      // ✅ 5. Notificar al administrador
      try {
        const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'marrano@ofimundo.cl';
        const dashboardLink = `${window.location.origin}/solicitud-proyecto`;
        
        const emailResult = await emailService.sendNotificacionCompletado(
          fromEmail,
          formData.nombreProyecto || 'Proyecto sin nombre',
          formData.nombreSolicitante || 'Solicitante',
          formData.area || 'Área no especificada',
          dashboardLink
        );
        
        if (emailResult.success) {
          console.log('✅ Notificación enviada al administrador:', fromEmail);
        } else {
          console.warn('⚠️ No se pudo enviar notificación al admin:', emailResult.message);
        }
      } catch (emailError) {
        console.error('❌ Error enviando notificación al admin:', emailError);
      }

      // ✅ 6. Enviar email de confirmación al solicitante (CORREGIDO)
      if (formData.email) {
        try {
          // ✅ Usar sendConfirmacionRegistro en lugar de sendEmail
          const confirmResult = await emailService.sendConfirmacionRegistro(
            formData.email,
            formData.nombreProyecto || 'Proyecto sin nombre',
            formData.nombreSolicitante || 'Solicitante',
            formData.area || 'Área no especificada',
            formData.descripcionGeneral || 'Sin descripción',
            formData.presupuesto || 0
          );
          
          if (confirmResult.success) {
            console.log('✅ Email de confirmación enviado al solicitante');
          } else {
            console.warn('⚠️ No se pudo enviar email de confirmación:', confirmResult.message);
          }
        } catch (confirmError) {
          console.error('Error enviando confirmación al solicitante:', confirmError);
        }
      }

      dismissToast(loadingId);
      showToast('✅ Formulario completado exitosamente', 'success');
      
      try {
        localStorage.setItem('solicitudes-need-refresh', Date.now().toString());
        console.log('📦 Flag de actualización guardado en localStorage');
      } catch (e) {
        console.warn('No se pudo guardar flag en localStorage:', e);
      }
      
      setEnviado(true);
      
    } catch (err: any) {
      console.error('❌ Error guardando formulario:', err);
      dismissToast(loadingId);
      
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error ||
                           err.message || 
                           'Error al guardar el formulario';
      showToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  // Pantalla de agradecimiento
  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Gracias por completar el formulario!</h2>
          <p className="text-gray-600 mb-6">
            Tu solicitud ha sido enviada exitosamente al equipo de gestión.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>✅ ¿Qué sigue?</strong>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              El equipo de gestión ha sido notificado y revisará tu solicitud. 
              Una vez que sea <strong>aprobada</strong>, recibirás un correo electrónico con la confirmación.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Enlace no válido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Por favor, contacta al equipo que te envió este formulario.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Formulario de Solicitud de Proyecto</h1>
            <p className="text-gray-600 mt-2">Por favor complete todos los campos requeridos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: DATOS DEL SOLICITANTE */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-800 mb-4">1. DATOS DEL SOLICITANTE (*)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Solicitante *</label>
                  <input 
                    type="text" 
                    name="nombreSolicitante" 
                    value={formData.nombreSolicitante || ''} 
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" 
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Área *</label>
                  <input 
                    type="text" 
                    name="area" 
                    value={formData.area || ''} 
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" 
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gerente Sponsor</label>
                  <input type="text" name="gerenteSponsor" value={formData.gerenteSponsor || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS GENERALES DEL PROYECTO */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-4">2. DATOS GENERALES DEL PROYECTO</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Proyecto *</label>
                  <input 
                    type="text" 
                    name="nombreProyecto" 
                    value={formData.nombreProyecto || ''} 
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" 
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Objetivo General</label>
                  <textarea name="objetivoGeneral" value={formData.objetivoGeneral || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Objetivos Específicos</label>
                  <textarea name="objetivosEspecificos" value={formData.objetivosEspecificos || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cobertura y Alcance</label>
                  <textarea name="coberturaAlcance" value={formData.coberturaAlcance || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: FOCO ESTRATÉGICO */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-800 mb-4">3. FOCO ESTRATÉGICO</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Foco Estratégico</label>
                  <textarea name="focoEstrategico" value={formData.focoEstrategico || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Impacto</label>
                  <textarea name="impacto" value={formData.impacto || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: SUSTENTO LEGAL Y REQUISITOS */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-800 mb-4">4. SUSTENTO LEGAL Y REQUISITOS</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="tieneSustentoLegal" checked={formData.tieneSustentoLegal || false} onChange={handleChange} />
                    <span className="text-sm">¿Existe sustento legal?</span>
                  </label>
                  {formData.tieneSustentoLegal && (
                    <input type="text" name="sustentoLegalCual" value={formData.sustentoLegalCual || ''} onChange={handleChange}
                      placeholder="¿Cuál?" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="tieneRequisitoFecha" checked={formData.tieneRequisitoFecha || false} onChange={handleChange} />
                    <span className="text-sm">¿Existe requisito de fecha?</span>
                  </label>
                  {formData.tieneRequisitoFecha && (
                    <div className="mt-2 space-y-2">
                      <input type="text" name="requisitoFechaCual" value={formData.requisitoFechaCual || ''} onChange={handleChange}
                        placeholder="¿Cuál?" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                      <input type="text" name="requisitoFechaPorque" value={formData.requisitoFechaPorque || ''} onChange={handleChange}
                        placeholder="¿Por qué?" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea name="observaciones" value={formData.observaciones || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* DATOS DEL ÁREA DE TECNOLOGÍA */}
            <div className="bg-pink-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-pink-800 mb-4">DATOS DEL ÁREA DE TECNOLOGÍA (**)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Responsable</label>
                  <input type="text" name="nombreResponsableProyecto" value={formData.nombreResponsableProyecto || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipo</label>
                  <input type="text" name="equipo" value={formData.equipo || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* DATOS DE LA CONTRAPARTE */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-indigo-800 mb-4">DATOS DE LA CONTRAPARTE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Contraparte Cliente</label>
                  <input type="text" name="nombreContraparteCliente" value={formData.nombreContraparteCliente || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Área</label>
                  <input type="text" name="areaContraparte" value={formData.areaContraparte || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Jefatura Directa</label>
                  <input type="text" name="nombreJefaturaDirecta" value={formData.nombreJefaturaDirecta || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN Y RESTRICCIONES */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-orange-800 mb-4">DESCRIPCIÓN Y RESTRICCIONES</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción General</label>
                  <textarea name="descripcionGeneral" value={formData.descripcionGeneral || ''} onChange={handleChange}
                    rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Presupuesto (USD)</label>
                    <input type="number" name="presupuesto" value={formData.presupuesto || ''} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tiempo Estimado</label>
                    <input type="text" name="tiempo" value={formData.tiempo || ''} onChange={handleChange}
                      placeholder="Ej: 3 meses" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Dólar</label>
                    <input type="number" step="0.01" name="valorDolar" value={formData.valorDolar || ''} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Otras Restricciones</label>
                  <textarea name="otrasRestricciones" value={formData.otrasRestricciones || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Riesgos</label>
                  <textarea name="riesgos" value={formData.riesgos || ''} onChange={handleChange}
                    rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                  <input type="date" name="fechaInicio" value={formData.fechaInicio || ''} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicSolicitudForm;