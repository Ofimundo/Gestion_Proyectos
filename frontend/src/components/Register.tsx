import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    empresa: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si ya hay sesión al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      onSwitchToLogin();
    }
  }, [isAuthenticated, onSwitchToLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores al escribir
    if (error) setError('');
  };

  const validateEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
    return usernameRegex.test(username);
  };

  // Verificar si el username ya existe
  const checkUsernameExists = async (username: string) => {
    try {
      const result = await authService.checkUsername(username);
      return result.exists;
    } catch (error) {
      console.error('Error verificando username:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones básicas
    if (!formData.nombre || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    // Validar nombre (mínimo 2 caracteres)
    if (formData.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    // Validar username
    if (!validateUsername(formData.username)) {
      setError('El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, puntos y guiones bajos');
      return;
    }

    // Verificar si el username ya existe
    const usernameExists = await checkUsernameExists(formData.username);
    if (usernameExists) {
      setError('El nombre de usuario ya está en uso. Por favor, elige otro.');
      return;
    }

    if (!validateEmailFormat(formData.email)) {
      setError('El formato del correo electrónico no es válido');
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

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setIsLoading(true);

    try {
      // Registrar usuario usando el authService
      const result = await authService.register({
        name: formData.nombre.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        empresa: formData.empresa.trim() || undefined
      });

      if (result && result.user) {
        setSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
        
        // Limpiar el formulario después del registro exitoso
        setTimeout(() => {
          setFormData({
            nombre: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            empresa: ''
          });
          setAcceptTerms(false);
          onSwitchToLogin();
        }, 2000);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 shadow-xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Crear cuenta
          </h2>
          <p className="text-gray-500 text-sm">
            Regístrate para acceder al panel corporativo
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="Juan Pérez"
                required
                disabled={loading || success !== ''}
              />
            </div>

            {/* Nombre de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de usuario *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="juan.perez"
                required
                disabled={loading || success !== ''}
              />
              <p className="text-xs text-gray-400 mt-1">
                Mínimo 3 caracteres. Solo letras, números, puntos y guiones bajos
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="nombre@empresa.com"
                required
                disabled={loading || success !== ''}
              />
            </div>

            {/* Empresa (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="Mi Empresa S.A."
                disabled={loading || success !== ''}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-12"
                  placeholder="••••••••"
                  required
                  disabled={loading || success !== ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  disabled={loading || success !== ''}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-12"
                  placeholder="••••••••"
                  required
                  disabled={loading || success !== ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  disabled={loading || success !== ''}
                >
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Mensaje de éxito */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !success && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                
                {error.includes('ya está registrado') && (
                  <div className="mt-3 text-xs text-gray-500">
                    <p>¿Ya tienes una cuenta?{' '}
                      <button 
                        onClick={onSwitchToLogin} 
                        className="text-indigo-600 hover:underline font-medium"
                        type="button"
                      >
                        Inicia sesión aquí
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Términos y condiciones */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                disabled={loading || success !== ''}
              />
              <span className="text-sm text-gray-600">
                Acepto los{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                  Términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                  Política de privacidad
                </a>
              </span>
            </label>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || success !== ''}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>

            {/* Volver al login */}
            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                disabled={loading}
              >
                Iniciar sesión
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Todos los derechos reservados. © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Register;