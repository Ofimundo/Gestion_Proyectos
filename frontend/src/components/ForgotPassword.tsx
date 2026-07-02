import React, { useState } from 'react';
import authService from '../services/authService';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'username' | 'password'>('username');

  // Verificar si el usuario existe (por username, nombre o email)
  const checkUserExists = async () => {
    setError('');
    setIsLoading(true);

    if (!username) {
      setError('El nombre de usuario es obligatorio');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.checkUsername(username);
      
      if (result.exists) {
        setStep('password');
        setError('');
      } else {
        setError('El nombre de usuario no está registrado');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.resetPasswordByUsername(username, newPassword);
      
      if (result) {
        setSuccess('¡Contraseña actualizada exitosamente!');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'username') {
      checkUserExists();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[90%] xs:max-w-sm sm:max-w-md md:max-w-lg">
        {/* Logo y título */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-3 sm:mb-4 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Recuperar contraseña
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 px-2">
            {step === 'username' 
              ? 'Ingresa tu nombre de usuario'
              : `Restableciendo para ${username}`}
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
          {success ? (
            // Mensaje de éxito
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center animate-bounce">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  ¡Contraseña actualizada!
                </h3>
                <p className="text-sm text-gray-500">{success}</p>
              </div>
              <button
                onClick={onSwitchToLogin}
                className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm sm:text-base hover:underline"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : step === 'username' ? (
            /* PASO 1: Ingresar usuario */
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm ${
                    error ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Tu nombre de usuario"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ingresa tu nombre de usuario, email o nombre completo
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
                </div>
              )}

              {/* Botón verificar */}
              <button
                onClick={checkUserExists}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden xs:inline">Verificando...</span>
                    <span className="xs:hidden">Verificando</span>
                  </span>
                ) : (
                  'Verificar usuario'
                )}
              </button>

              {/* Volver al login */}
              <p className="text-center text-xs sm:text-sm text-gray-600">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  ← Volver al inicio de sesión
                </button>
              </p>
            </div>
          ) : (
            /* PASO 2: Ingresar nueva contraseña */
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
              {/* Usuario verificado */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-xs sm:text-sm text-green-700 break-words">
                  ✓ Usuario verificado: <span className="font-semibold">{username}</span>
                </p>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm pr-10 sm:pr-12"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    disabled={isLoading}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm pr-10 sm:pr-12"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
                </div>
              )}

              {/* Botón restablecer */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden xs:inline">Actualizando...</span>
                    <span className="xs:hidden">Enviando...</span>
                  </span>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>

              {/* Volver al paso anterior */}
              <p className="text-center text-xs sm:text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => setStep('username')}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  disabled={isLoading}
                >
                  ← Usar otro usuario
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4 sm:mt-6 md:mt-8">
          Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;