import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ResetPasswordProps {
  onSwitchToLogin: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onSwitchToLogin }) => {
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Obtener token y email de la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');
    
    setToken(urlToken);
    setEmail(urlEmail);

    if (!urlToken || !urlEmail) {
      setError('Enlace de recuperación inválido');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Enlace de recuperación inválido');
      return;
    }

    // Validaciones
    if (!formData.password || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="w-full max-w-[90%] xs:max-w-sm sm:max-w-md">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Enlace inválido</h3>
              <p className="text-sm text-gray-500 mb-6">El enlace de recuperación no es válido o ha expirado.</p>
              <button
                onClick={onSwitchToLogin}
                className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm sm:text-base"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[90%] xs:max-w-sm sm:max-w-md md:max-w-lg">
        {/* Logo y título */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-3 sm:mb-4 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Restablecer contraseña
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 px-2 break-words">
            {email && `Para ${email}`}
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Token oculto (solo informativo) */}
              {token && (
                <div className="text-xs text-gray-400 text-center">
                  Token válido
                </div>
              )}

              {/* Nueva contraseña */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm pr-10 sm:pr-12"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
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
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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

              {/* Error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
                </div>
              )}

              {/* Botón */}
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
                    <span className="hidden xs:inline">Restableciendo...</span>
                    <span className="xs:hidden">Enviando...</span>
                  </span>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>

              {/* Volver al login */}
              <p className="text-center text-xs sm:text-sm text-gray-600">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  disabled={isLoading}
                >
                  ← Volver al inicio de sesión
                </button>
              </p>
            </form>
          ) : (
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
                <p className="text-sm text-gray-500">
                  Tu contraseña ha sido restablecida exitosamente
                </p>
              </div>
              <button
                onClick={onSwitchToLogin}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar sesión
              </button>
            </div>
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

export default ResetPassword;