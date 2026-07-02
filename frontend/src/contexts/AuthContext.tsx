import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  nombre: string;
  username: string;
  email: string;
  empresa?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nombre: string;
  username: string;
  email: string;
  password: string;
  empresa?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface StoredUser {
  id: string;
  nombre: string;
  username: string;
  email: string;
  empresa?: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'rpa_users',
  CURRENT_USER: 'rpa_current_user',
  SESSION: 'rpa_session'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para cargar usuarios desde localStorage
  const loadUsers = (): StoredUser[] => {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        return Array.isArray(parsedUsers) ? parsedUsers : [];
      }
      return [];
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      return [];
    }
  };

  // Función para guardar usuarios en localStorage
  const saveUsers = (users: StoredUser[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Error guardando usuarios:', error);
    }
  };

  // Función para inicializar usuarios por defecto
  const initializeDefaultUsers = () => {
    const users = loadUsers();
    if (users.length === 0) {
      const defaultUsers: StoredUser[] = [
        {
          id: '1',
          nombre: 'Administrador',
          username: 'admin',
          email: 'admin@rpa.com',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      saveUsers(defaultUsers);
      return defaultUsers;
    }
    return users;
  };

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = () => {
      try {
        // Inicializar usuarios por defecto si no existen
        initializeDefaultUsers();
        
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('current_user');
        const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
        
        if (token && storedUser) {
          // Sesión real (Backend API)
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else if (storedSession) {
          // Sesión mock (Fallback)
          const sessionData = JSON.parse(storedSession);
          const expirationTime = sessionData.expiresAt;
          
          if (expirationTime && new Date(expirationTime) > new Date()) {
            setUser(sessionData.user);
            setIsAuthenticated(true);
          } else {
            // Sesión expirada, limpiar
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const users = loadUsers();
      const { email, password } = credentials;
      
      // Buscar usuario por email o username
      const foundUser = users.find(
        u => (u.email === email || u.username === email) && u.password === password
      );
      
      if (!foundUser) {
        throw new Error('Credenciales incorrectas');
      }
      
      // Crear objeto de usuario sin la contraseña
      const loggedUser: User = {
        id: foundUser.id,
        nombre: foundUser.nombre,
        username: foundUser.username,
        email: foundUser.email,
        empresa: foundUser.empresa,
        role: foundUser.role,
        createdAt: foundUser.createdAt
      };
      
      // Guardar sesión con expiración (24 horas)
      const sessionData = {
        user: loggedUser,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedUser));
      
      setUser(loggedUser);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      const users = loadUsers();
      
      // Verificar si el username ya existe
      if (users.some(u => u.username === data.username)) {
        throw new Error('El nombre de usuario ya está registrado');
      }
      
      // Verificar si el email ya existe
      if (users.some(u => u.email === data.email)) {
        throw new Error('El correo electrónico ya está registrado');
      }
      
      // Determinar si es el primer usuario (será admin)
      const isFirstUser = users.length === 0;
      
      // Crear nuevo usuario
      const newUser: StoredUser = {
        id: Date.now().toString(),
        nombre: data.nombre,
        username: data.username,
        email: data.email,
        password: data.password,
        empresa: data.empresa,
        role: isFirstUser ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };
      
      // Guardar en localStorage
      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      
      // Si es el primer usuario, iniciar sesión automáticamente
      if (isFirstUser) {
        const loggedUser: User = {
          id: newUser.id,
          nombre: newUser.nombre,
          username: newUser.username,
          email: newUser.email,
          empresa: newUser.empresa,
          role: newUser.role,
          createdAt: newUser.createdAt
        };
        
        const sessionData = {
          user: loggedUser,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedUser));
        
        setUser(loggedUser);
        setIsAuthenticated(true);
      }
      
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem('current_user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Actualizar en localStorage para sesión mock
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        parsed.user = updatedUser;
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(parsed));
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      
      // Actualizar en localStorage para sesión real (API backend)
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      // También actualizar en la lista de usuarios
      const users = loadUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, nombre: updatedUser.nombre, email: updatedUser.email, empresa: updatedUser.empresa }
          : u
      );
      saveUsers(updatedUsers);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
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