import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  empresa: string | null;
  activo: number;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total: number;
  activos: number;
  inactivos: number;
  admins: number;
  users: number;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      
      if (response.data.success) {
        setUsers(response.data.users);
        // Calcular estadísticas
        const statsData = {
          total: response.data.users.length,
          activos: response.data.users.filter((u: User) => u.activo !== 0).length,
          inactivos: response.data.users.filter((u: User) => u.activo === 0).length,
          admins: response.data.users.filter((u: User) => u.role === 'admin').length,
          users: response.data.users.filter((u: User) => u.role === 'user').length,
        };
        setStats(statsData);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Cambiar rol de usuario
  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const response = await api.put(`/auth/users/${userId}/role`, { role });
      
      if (response.data.success) {
        await loadUsers(); // Recargar usuarios
        setShowModal(false);
        setSelectedUser(null);
        setNewRole('');
      } else {
        setError('Error al cambiar rol');
      }
    } catch (err: any) {
      console.error('Error cambiando rol:', err);
      setError(err.response?.data?.message || 'Error al cambiar rol');
    }
  };

  // Activar/desactivar usuario
  const handleToggleUser = async (userId: string) => {
    try {
      const response = await api.put(`/auth/users/${userId}/toggle`);
      
      if (response.data.success) {
        await loadUsers(); // Recargar usuarios
      } else {
        setError('Error al cambiar estado');
      }
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      
      if (response.data.success) {
        await loadUsers(); // Recargar usuarios
      } else {
        setError('Error al eliminar usuario');
      }
    } catch (err: any) {
      console.error('Error eliminando usuario:', err);
      setError(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  // Abrir modal para cambiar rol
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestión de usuarios y configuración del sistema</p>
        </div>
        <button
          onClick={loadUsers}
          className="mt-2 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-600">{stats?.activos || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{stats?.inactivos || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Administradores</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.admins || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.users || 0}</p>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Usuarios Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.activo !== 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.activo !== 0 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openRoleModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                          title="Cambiar rol"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleUser(user.id)}
                          className={`text-sm ${user.activo !== 0 ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                          title={user.activo !== 0 ? 'Desactivar' : 'Activar'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para cambiar rol */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Cambiar Rol de {selectedUser.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona el nuevo rol para el usuario
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 mb-4"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleChangeRole(selectedUser.id, newRole)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;