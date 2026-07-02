// src/components/Toast.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: Toast['type'], duration?: number) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showLoading: (message: string) => string;
  dismissLoading: (id: string) => void;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook personalizado para usar el toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Proveedor de toast
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration: number = 3000) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration: number = 4000) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration: number = 3000) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration: number = 3500) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const showLoading = useCallback((message: string) => {
    return showToast(message, 'loading', 0);
  }, [showToast]);

  const dismissLoading = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const dismissToast = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Limpiar toasts al desmontar
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const getToastStyles = (type: Toast['type']): string => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'loading': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getToastIcon = (type: Toast['type']): React.ReactNode => {
    switch (type) {
      case 'success': return <span>✅</span>;
      case 'error': return <span>❌</span>;
      case 'warning': return <span>⚠️</span>;
      case 'loading': return (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
      default: return <span>ℹ️</span>;
    }
  };

  const value = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismissLoading,
    dismissToast,
    clearAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white min-w-[280px] max-w-md pointer-events-auto transition-all duration-300 ${getToastStyles(toast.type)}`}
            style={{
              animation: 'slideInRight 0.3s ease-out forwards'
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
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
      `}</style>
    </ToastContext.Provider>
  );
};

// Funciones independientes para usar sin contexto (para casos simples)
let globalShowToast: ((message: string, type: Toast['type'], duration?: number) => string) | null = null;
let globalShowSuccess: ((message: string, duration?: number) => string) | null = null;
let globalShowError: ((message: string, duration?: number) => string) | null = null;
let globalShowInfo: ((message: string, duration?: number) => string) | null = null;
let globalShowWarning: ((message: string, duration?: number) => string) | null = null;
let globalShowLoading: ((message: string) => string) | null = null;
let globalDismissLoading: ((id: string) => void) | null = null;
let globalDismissToast: ((id: string) => void) | null = null;
let globalClearAll: (() => void) | null = null;

// Inicializar funciones globales (llamar desde el provider)
export const initializeToast = (
  showToastFn: (message: string, type: Toast['type'], duration?: number) => string,
  showSuccessFn: (message: string, duration?: number) => string,
  showErrorFn: (message: string, duration?: number) => string,
  showInfoFn: (message: string, duration?: number) => string,
  showWarningFn: (message: string, duration?: number) => string,
  showLoadingFn: (message: string) => string,
  dismissLoadingFn: (id: string) => void,
  dismissToastFn: (id: string) => void,
  clearAllFn: () => void
) => {
  globalShowToast = showToastFn;
  globalShowSuccess = showSuccessFn;
  globalShowError = showErrorFn;
  globalShowInfo = showInfoFn;
  globalShowWarning = showWarningFn;
  globalShowLoading = showLoadingFn;
  globalDismissLoading = dismissLoadingFn;
  globalDismissToast = dismissToastFn;
  globalClearAll = clearAllFn;
};

// Exportar funciones para usar sin el hook
export const showToast = (message: string, type: Toast['type'] = 'info', duration?: number): string => {
  if (globalShowToast) {
    return globalShowToast(message, type, duration);
  }
  console.log(`Toast: ${message} (${type})`);
  return Date.now().toString();
};

export const showSuccess = (message: string, duration?: number): string => {
  if (globalShowSuccess) {
    return globalShowSuccess(message, duration);
  }
  console.log(`✅ Success: ${message}`);
  return Date.now().toString();
};

export const showError = (message: string, duration?: number): string => {
  if (globalShowError) {
    return globalShowError(message, duration);
  }
  console.log(`❌ Error: ${message}`);
  return Date.now().toString();
};

export const showInfo = (message: string, duration?: number): string => {
  if (globalShowInfo) {
    return globalShowInfo(message, duration);
  }
  console.log(`ℹ️ Info: ${message}`);
  return Date.now().toString();
};

export const showWarning = (message: string, duration?: number): string => {
  if (globalShowWarning) {
    return globalShowWarning(message, duration);
  }
  console.log(`⚠️ Warning: ${message}`);
  return Date.now().toString();
};

export const showLoading = (message: string): string => {
  if (globalShowLoading) {
    return globalShowLoading(message);
  }
  console.log(`🔄 Loading: ${message}`);
  return Date.now().toString();
};

export const dismissLoading = (id: string) => {
  if (globalDismissLoading) {
    globalDismissLoading(id);
  }
};

export const dismissToast = (id: string) => {
  if (globalDismissToast) {
    globalDismissToast(id);
  }
};

export const clearAllToasts = () => {
  if (globalClearAll) {
    globalClearAll();
  }
};

// Componente de ejemplo para usar en la App
export const ToastDemo: React.FC = () => {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <button
        onClick={() => toast.showSuccess('Operación completada exitosamente')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Success
      </button>
      <button
        onClick={() => toast.showError('Ocurrió un error inesperado')}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Error
      </button>
      <button
        onClick={() => toast.showWarning('Advertencia: Revisa los datos')}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
      >
        Warning
      </button>
      <button
        onClick={() => toast.showInfo('Información importante')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Info
      </button>
      <button
        onClick={() => {
          const id = toast.showLoading('Cargando datos...');
          setTimeout(() => toast.dismissLoading(id), 3000);
        }}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Loading
      </button>
    </div>
  );
};

export default ToastProvider;