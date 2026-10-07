// src/components/PublicFichaForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Profesional {
  id: string;
  nombre: string;
  cargo?: string;
}

interface FichaProyecto {
  id: string;
  codigo: string;
  nombreProyecto: string;
  cliente: string;
  lider: string;
  descripcion: string;
  tecnologias: string;
  venta: number;
  hhImplementacion: number;
  hhPeriodo: number;
  hhPlanificadas: number;
  hhReal: number;
  recursos: string[];
  recursosIds: string[];
  horasPorRecurso: { [recursoId: string]: number };
  fechaInicio: string;
  fechaTermino: string;
  estado: string;
}

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

const PublicFichaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);

  const [formData, setFormData] = useState<Partial<FichaProyecto>>({
    hhImplementacion: 0,
    hhPeriodo: 0,
    hhPlanificadas: 0,
    tecnologias: '',
    fechaInicio: '',
    fechaTermino: '',
    descripcion: '',
    recursosIds: [],
    horasPorRecurso: {},
  });

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const toastId = Date.now().toString();
    setToasts(prev => [...prev, { id: toastId, message, type }]);
    return toastId;
  };

  const dismissToast = (toastId: string) => setToasts(prev => prev.filter(t => t.id !== toastId));

  useEffect(() => {
    if (!id) {
      setError('Identificador de proyecto no válido');
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Cargar profesionales
        try {
          const resProf = await api.get('/professionals/public/list');
          if (resProf.data.success) {
            setProfesionales(resProf.data.data || []);
          }
        } catch (e) {
          console.warn('No se pudo cargar lista pública de profesionales:', e);
        }

        // Cargar datos de la ficha
        const response = await api.get(`/fichas/public/${id}`);
        if (response.data.success && response.data.data) {
          const ficha = response.data.data;
          console.log('✅ Ficha pública cargada:', ficha);
          setFormData({
            ...ficha,
            recursosIds: ficha.recursosIds || [],
            horasPorRecurso: ficha.horasPorRecurso || {},
          });
        } else {
          setError('La ficha del proyecto no fue encontrada o el enlace expiró.');
        }
      } catch (err: any) {
        console.error('❌ Error al cargar ficha pública:', err);
        setError(err.response?.data?.message || 'Error al cargar la ficha del proyecto');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleRecursoToggle = (profId: string) => {
    setFormData(prev => {
      const currentIds = prev.recursosIds || [];
      const currentHoras = { ...(prev.horasPorRecurso || {}) };

      if (currentIds.includes(profId)) {
        const newIds = currentIds.filter(id => id !== profId);
        delete currentHoras[profId];
        return { ...prev, recursosIds: newIds, horasPorRecurso: currentHoras };
      } else {
        const newIds = [...currentIds, profId];
        currentHoras[profId] = 0;
        return { ...prev, recursosIds: newIds, horasPorRecurso: currentHoras };
      }
    });
  };

  const handleHorasRecursoChange = (profId: string, horas: number) => {
    setFormData(prev => ({
      ...prev,
      horasPorRecurso: {
        ...(prev.horasPorRecurso || {}),
        [profId]: Math.max(0, horas)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showToast('Error: Identificador de proyecto inválido', 'error');
      return;
    }

    const loadingId = showToast('Guardando datos del proyecto...', 'loading');

    try {
      const datosActualizados = {
        ...formData,
        hhImplementacion: Number(formData.hhImplementacion || 0),
        hhPeriodo: Number(formData.hhPeriodo || 0),
        hhPlanificadas: Number(formData.hhPlanificadas || 0),
        fechaInicio: formData.fechaInicio || undefined,
        fechaTermino: formData.fechaTermino || undefined,
        tecnologias: formData.tecnologias || '',
        descripcion: formData.descripcion || '',
        recursosIds: formData.recursosIds || [],
        horasPorRecurso: formData.horasPorRecurso || {}
      };

      console.log('📤 Guardando ficha pública:', datosActualizados);
      const response = await api.put(`/fichas/public/${id}`, datosActualizados);

      dismissToast(loadingId);

      if (response.data.success) {
        showToast('✅ Ficha actualizada exitosamente', 'success');
        setEnviado(true);
        window.dispatchEvent(new Event('fichas-updated'));
      } else {
        throw new Error(response.data.message || 'Error al actualizar ficha');
      }
    } catch (err: any) {
      dismissToast(loadingId);
      console.error('❌ Error al guardar ficha pública:', err);
      const msg = err.response?.data?.message || err.message || 'Error al guardar el formulario';
      showToast(`❌ ${msg}`, 'error');
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Información Guardada Con Éxito!</h2>
          <p className="text-gray-600 mb-6">
            Los datos de HH, fechas, tecnologías y recursos del proyecto <strong>{formData.nombreProyecto}</strong> han sido registrados en el sistema.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del proyecto...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Formulario de Asignación de Proyecto</h1>
            <p className="text-gray-600 mt-2">
              Completar datos de HH, fechas, tecnologías y recursos asignados
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 text-lg mb-2">📌 Proyecto: {formData.nombreProyecto}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <p><strong>Código:</strong> {formData.codigo || 'S/C'}</p>
              <p><strong>Cliente:</strong> {formData.cliente || 'No especificado'}</p>
              <p><strong>Líder:</strong> {formData.lider || 'Por asignar'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN HH */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-lg font-bold text-emerald-800 mb-4">⏱️ 1. HORAS HOMBRE (HH)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">HH Implementación</label>
                  <input
                    type="number"
                    name="hhImplementacion"
                    value={formData.hhImplementacion || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HH Periodo</label>
                  <input
                    type="number"
                    name="hhPeriodo"
                    value={formData.hhPeriodo || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HH Planificadas Total</label>
                  <input
                    type="number"
                    name="hhPlanificadas"
                    value={formData.hhPlanificadas || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN FECHAS */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="text-lg font-bold text-amber-800 mb-4">📅 2. FECHAS DEL PROYECTO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Término</label>
                  <input
                    type="date"
                    name="fechaTermino"
                    value={formData.fechaTermino || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN TECNOLOGÍAS */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-4">💻 3. TECNOLOGÍAS Y HERRAMIENTAS</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especificar Tecnologías</label>
                <textarea
                  name="tecnologias"
                  value={formData.tecnologias || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ej: UiPath, Python, SQL Server, Power BI..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* SECCIÓN RECURSOS */}
            <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
              <h3 className="text-lg font-bold text-sky-800 mb-4">👥 4. RECURSOS DEL EQUIPO Y DISTRIBUCIÓN DE HORAS</h3>
              {profesionales.length === 0 ? (
                <p className="text-sm text-gray-500">Cargando profesionales o no hay profesionales disponibles...</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                  {profesionales.map(prof => {
                    const isSelected = (formData.recursosIds || []).includes(String(prof.id));
                    const horas = (formData.horasPorRecurso || {})[String(prof.id)] || 0;

                    return (
                      <div key={prof.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border-b border-gray-100 last:border-0">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRecursoToggle(String(prof.id))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <div>
                            <span className="font-medium text-gray-800">{prof.nombre}</span>
                            {prof.cargo && <span className="text-xs text-gray-500 ml-2">({prof.cargo})</span>}
                          </div>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Horas:</span>
                            <input
                              type="number"
                              value={horas}
                              onChange={(e) => handleHorasRecursoChange(String(prof.id), Number(e.target.value))}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN DESCRIPCIÓN */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📝 DESCRIPCIÓN Y OBSERVACIONES</h3>
              <div>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observaciones adicionales sobre el proyecto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow transition-colors"
              >
                💾 Guardar Formulario
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicFichaForm;
