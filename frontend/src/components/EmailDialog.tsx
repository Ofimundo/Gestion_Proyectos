// src/components/EmailDialog.tsx
import React, { useState } from 'react';
import emailService from '../services/emailService';
import { showToast } from './Toast';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: string;
  solicitudNombre: string;
  solicitudData?: {
    nombreSolicitante: string;
    area: string;
    link?: string;
  };
  onSend?: (email: string) => Promise<void>;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ 
  isOpen, 
  onClose, 
  solicitudId, 
  solicitudNombre, 
  solicitudData,
  onSend 
}) => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar email
    if (!email) {
      showToast.error('Por favor ingresa un email válido');
      return;
    }

    if (!emailService.validateEmail(email)) {
      showToast.error('El email ingresado no es válido');
      return;
    }
    
    setEnviando(true);

    try {
      // Si hay un callback personalizado, usarlo
      if (onSend) {
        await onSend(email);
      } else {
        // Usar el servicio de email directamente
        const result = await emailService.sendFormularioEmail(
          email,
          solicitudNombre,
          solicitudData?.nombreSolicitante || 'Solicitante',
          solicitudData?.area || 'Área no especificada',
          solicitudData?.link || `${window.location.origin}/solicitud-proyecto/${solicitudId}`
        );

        if (result.success) {
          showToast.success(result.message || 'Email enviado exitosamente');
          setEmail('');
          onClose();
        } else {
          setError(result.message || 'Error al enviar el email');
          showToast.error(result.message || 'Error al enviar el email');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al enviar el email';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar por Email
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={enviando}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-4">
            Enviar formulario de solicitud para: <strong className="text-gray-900">{solicitudNombre}</strong>
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico del destinatario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="ejemplo@empresa.com"
              required
              disabled={enviando}
            />
            <p className="mt-1 text-xs text-gray-500">
              El destinatario recibirá un link para completar el formulario
            </p>
          </div>

          {/* Información adicional del proyecto */}
          {solicitudData && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Solicitante:</strong> {solicitudData.nombreSolicitante}
              </p>
              <p className="text-xs text-blue-700">
                <strong>Área:</strong> {solicitudData.area}
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailDialog;