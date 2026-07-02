import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, isLoading } = useAuth();
  
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Sincronizar nombre cuando cambie el usuario
  useEffect(() => {
    if (user?.nombre) {
      setNombre(user.nombre);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLocalLoading(true);

    // Validar que haya al menos un cambio
    if (nombre === user?.nombre && !newPassword) {
      setError('No hay cambios para guardar');
      setLocalLoading(false);
      return;
    }

    // Si se quiere cambiar la contraseña, validar
    if (newPassword) {
      if (!currentPassword) {
        setError('Debes ingresar tu contraseña actual');
        setLocalLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        setLocalLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Las contraseñas nuevas no coinciden');
        setLocalLoading(false);
        return;
      }
    }

    try {
      const updateData: { name?: string; password?: string } = {};
      
      if (nombre !== user?.nombre) {
        updateData.name = nombre;
      }
      
      if (newPassword) {
        // Usar el método changePassword del authService
        await authService.changePassword(currentPassword, newPassword);
        // La contraseña se actualizó exitosamente
      }

      // Actualizar nombre si cambió
      if (nombre !== user?.nombre) {
        const updatedUser = await authService.updateProfile({ 
          name: nombre 
        });
        
        // Actualizar el contexto con el nuevo usuario
        if (updateUser) {
          updateUser(updatedUser);
        }
      }

      // Si solo se cambió la contraseña y no el nombre
      if (nombre === user?.nombre && newPassword) {
        // Ya se cambió la contraseña con authService.changePassword
        // Solo mostramos mensaje de éxito
      }
      
      setSuccess('Perfil actualizado exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = isLoading || localLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-indigo-600 mr-2 sm:mr-4 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xs:inline">Volver</span>
              </button>
              <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
                Mi Perfil
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-2xl mx-auto py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600">
                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white break-words px-2">
              {user?.nombre || 'Usuario'}
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 break-words px-2">
              {user?.email || 'usuario@email.com'}
            </p>
            <span className="inline-block mt-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white">
              {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>

          {/* Formulario */}
          <div className="p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 sm:mb-6 bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-lg animate-pulse">
                <p className="text-xs sm:text-sm text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={!isEditing || loading}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-100' : 'border-gray-300'
                    }`}
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="absolute right-2 sm:right-3 top-2 sm:top-3 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>
              </div>

              {/* Cambiar contraseña (solo visible en modo edición) */}
              {isEditing && (
                <>
                  <div className="border-t border-gray-200 my-4 sm:my-6 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                      Cambiar contraseña
                    </h3>
                  </div>

                  {/* Contraseña actual */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 sm:pr-12"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 sm:right-3 top-2 sm:top-3 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 sm:pr-12"
                        placeholder="••••••••"
                        disabled={loading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 sm:right-3 top-2 sm:top-3 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {showNewPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar nueva contraseña */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 sm:pr-12"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 sm:right-3 top-2 sm:top-3 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3 pt-3 sm:pt-4">
                {isEditing ? (
                  <>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full xs:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Guardando...
                        </span>
                      ) : (
                        'Guardar cambios'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setNombre(user?.nombre || '');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="w-full xs:flex-1 bg-white border-2 border-gray-300 text-gray-700 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-semibold"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold"
                  >
                    Editar perfil
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Perfil;