// src/components/Login.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ 
  onSwitchToRegister, 
  onSwitchToForgotPassword,
  onLoginSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Verificar si ya hay sesión al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔑 Usuario ya autenticado, redirigiendo...');
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  // Cargar email guardado si existe
  useEffect(() => {
    const savedEmail = localStorage.getItem('rpa_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError('Demasiados intentos fallidos. Espera 30 segundos.');
      return;
    }

    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Intentando login con:', email);
      const result = await authService.login({ email, password });
      
      if (result && result.user) {
        console.log('✅ Login exitoso!');
        setAttempts(0);
        
        // Guardar email si se seleccionó "Recordar sesión"
        if (rememberMe) {
          localStorage.setItem('rpa_remembered_email', email);
        } else {
          localStorage.removeItem('rpa_remembered_email');
        }
        
        // ✅ REDIRECCIÓN DIRECTA DESDE EL COMPONENTE LOGIN
        console.log('🔄 Redirigiendo a /dashboard...');
        // Opción 1: window.location
        window.location.href = '/dashboard';
        // Opción 2: window.location.replace
        // window.location.replace('/dashboard');
        
        // Llamar al callback también
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setError('Demasiados intentos fallidos. Espera 30 segundos.');
        
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const loading = isLoading || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[90%] xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-3 sm:mb-4 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Bienvenido
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 px-2">
            Accede a tu panel de control corporativo
          </p>
          
          <button
            type="button"
            onClick={toggleDebugInfo}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showDebugInfo ? 'Ocultar' : 'Mostrar'} información
          </button>
          
          {showDebugInfo && (
            <div className="mt-2 p-2 sm:p-3 bg-gray-100 rounded-lg text-xs text-left max-w-full overflow-x-auto">
              <p className="font-semibold text-gray-700 mb-1">🔐 Información de acceso:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="font-medium">Usuario:</span> marrano@ofimundo.cl / 123456</li>
                <li>• Puedes usar email o nombre de usuario</li>
                <li>• La sesión dura 24 horas</li>
                <li>• <span className="text-green-600 font-medium">✅ Conectado a la API real</span></li>
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email o nombre de usuario
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                placeholder="usuario@empresa.com o usuario"
                required
                disabled={loading || isBlocked}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm pr-10 sm:pr-12"
                  placeholder="••••••••"
                  required
                  disabled={loading || isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  disabled={loading || isBlocked}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
                {attempts > 0 && !isBlocked && (
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    Intentos fallidos: {attempts}/3
                  </p>
                )}
                {isBlocked && (
                  <p className="text-xs text-orange-600 mt-1 sm:mt-2">
                    ⏱️ Espera 30 segundos antes de volver a intentar
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  disabled={loading || isBlocked}
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-600">Recordar sesión</span>
              </label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                disabled={loading || isBlocked}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || isBlocked}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden xs:inline">Iniciando sesión...</span>
                  <span className="xs:hidden">Ingresando...</span>
                </span>
              ) : isBlocked ? (
                'Bloqueado - Espera 30s'
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <p className="text-center text-xs sm:text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                disabled={loading || isBlocked}
              >
                Regístrate gratis
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 sm:mt-6 md:mt-8">
          Todos los derechos reservados. © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;