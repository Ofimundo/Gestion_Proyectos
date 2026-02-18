import React, { createContext, useState, useContext, useEffect } from 'react';
// Eliminamos bcrypt porque no se usa en el frontend

interface User {
  email: string;
  name: string;
  username: string;
  role: string;
}

interface AuthContextType {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { 
    nombre: string; 
    username: string;
    email: string; 
    password: string;
    empresa?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: { nombre?: string; username?: string; password?: string }) => Promise<void>;
  isLoading: boolean;
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: { email: string; password: string }) => {
    const { email, password } = credentials;
    setIsLoading(true);
    
    try {
      // Llamar al backend para login
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      // Guardar usuario en el estado
      const userData: User = {
        email: data.user.email,
        name: data.user.nombre,
        username: data.user.username,
        role: data.user.role
      };

      setUser(userData);
      
      // Guardar token si es necesario
      if (data.token) {
        localStorage.setItem('rpa_token', data.token);
      }
      
      console.log('✅ Login exitoso para:', email);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { 
    nombre: string; 
    username: string;
    email: string; 
    password: string;
    empresa?: string;
  }) => {
    setIsLoading(true);
    
    try {
      // Llamar al backend para registrar
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al registrar usuario');
      }
      
      console.log('✅ Registro exitoso para:', userData.email);
    } catch (error) {
      console.error('❌ Registro failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: { nombre?: string; username?: string; password?: string }) => {
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Implementar actualización en el backend
      const response = await fetch(`http://localhost:3001/api/users/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar usuario');
      }

      // Actualizar usuario local
      setUser({
        ...user,
        name: data.nombre || user.name,
        username: data.username || user.username
      });

      console.log('✅ Usuario actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rpa_token');
    console.log('👋 Sesión cerrada');
  };

  // Verificar si hay sesión guardada al iniciar
  useEffect(() => {
    const token = localStorage.getItem('rpa_token');
    if (token) {
      // Aquí podrías validar el token con el backend
      // Por ahora, solo limpiamos si hay problemas
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      login, 
      register,
      logout,
      updateUser,
      isLoading, 
      user,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};