// src/services/authService.ts
import type { User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, AuthResponse } from '../types/auth.types';
import api from './api';

class AuthService {
  // Login - Usa la API real
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService: Intentando login con:', credentials.email);
      
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar token y usuario en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ Token guardado en localStorage');
      }
      if (data.user) {
        localStorage.setItem('current_user', JSON.stringify(data.user));
        console.log('✅ Usuario guardado en localStorage:', data.user);
      }

      return {
        user: data.user,
        token: data.token,
        message: data.message || 'Login exitoso'
      };
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      const message = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      throw new Error(message);
    }
  }

  // Registro - Usa la API real
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar que las contraseñas coincidan (si confirmPassword está provisto)
      if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        username: data.username || data.email.split('@')[0],
        empresa: data.empresa || null
      });

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al registrar usuario');
      }

      // Guardar token y usuario en localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.user) {
        localStorage.setItem('current_user', JSON.stringify(result.user));
      }

      return {
        user: result.user,
        token: result.token,
        message: result.message || 'Usuario registrado exitosamente'
      };
    } catch (error: any) {
      console.error('Error en registro:', error);
      const message = error.response?.data?.message || error.message || 'Error al registrar usuario';
      throw new Error(message);
    }
  }

  // Recuperar contraseña - Usa la API real
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: data.email
      });

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al procesar la solicitud');
      }

      return {
        message: result.message || 'Si el email está registrado, recibirás instrucciones'
      };
    } catch (error: any) {
      console.error('Error en forgotPassword:', error);
      const message = error.response?.data?.message || error.message || 'Error al procesar la solicitud';
      throw new Error(message);
    }
  }

  // Resetear contraseña - Usa la API real
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    try {
      // Verificar que las contraseñas coincidan
      if (data.password !== data.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const response = await api.post('/auth/reset-password', {
        token: data.token,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al restablecer la contraseña');
      }

      return {
        message: result.message || 'Contraseña actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('Error en resetPassword:', error);
      const message = error.response?.data?.message || error.message || 'Error al restablecer la contraseña';
      throw new Error(message);
    }
  }

  // Resetear contraseña por nombre de usuario (método directo sin email)
  async resetPasswordByUsername(username: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password-by-username', {
        username,
        newPassword
      });

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al restablecer la contraseña');
      }

      return {
        message: result.message || 'Contraseña actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('Error en resetPasswordByUsername:', error);
      const message = error.response?.data?.message || error.message || 'Error al restablecer la contraseña';
      throw new Error(message);
    }
  }

  // Verificar si un usuario existe (por nombre, username o email)
  async checkUsername(username: string): Promise<{ exists: boolean; nombre: string | null }> {
    try {
      const response = await api.post('/auth/check-username', { username });
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al verificar usuario');
      }

      return {
        exists: result.exists,
        nombre: result.nombre
      };
    } catch (error: any) {
      console.error('Error en checkUsername:', error);
      const message = error.response?.data?.message || error.message || 'Error al verificar usuario';
      throw new Error(message);
    }
  }

  // Obtener usuario actual - Usa la API real
  async getCurrentUser(): Promise<User | null> {
    try {
      // Primero verificar si hay token
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const response = await api.get('/auth/me');
      const result = response.data;
      
      if (!result.success) {
        // Si hay error, limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('current_user');
        return null;
      }

      // Actualizar usuario en localStorage
      if (result.user) {
        localStorage.setItem('current_user', JSON.stringify(result.user));
      }

      return result.user || null;
    } catch (error: any) {
      console.error('Error en getCurrentUser:', error);
      // Si hay error, limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('current_user');
      return null;
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put('/auth/profile', userData);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar perfil');
      }

      // Actualizar usuario en localStorage
      if (result.user) {
        localStorage.setItem('current_user', JSON.stringify(result.user));
      }

      return result.user;
    } catch (error: any) {
      console.error('Error en updateProfile:', error);
      const message = error.response?.data?.message || error.message || 'Error al actualizar perfil';
      throw new Error(message);
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Error al cambiar contraseña');
      }

      return {
        message: result.message || 'Contraseña cambiada exitosamente'
      };
    } catch (error: any) {
      console.error('Error en changePassword:', error);
      const message = error.response?.data?.message || error.message || 'Error al cambiar contraseña';
      throw new Error(message);
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem('current_user');
    localStorage.removeItem('token');
    console.log('👋 Sesión cerrada');
  }

  // Obtener usuario desde localStorage (sincrónico)
  getLocalUser(): User | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }

  // Verificar si está autenticado (basado en token)
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('current_user');
    return !!(token && user);
  }

  // Obtener el token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verificar que el token sea válido (opcional)
  async verifyToken(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();