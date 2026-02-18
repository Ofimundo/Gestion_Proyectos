import type { User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, AuthResponse } from '../types/auth.types';

class AuthService {
  // Obtener usuarios registrados del localStorage
  private getUsers(): User[] {
    const users = localStorage.getItem('registered_users');
    return users ? JSON.parse(users) : [];
  }

  // Guardar usuarios en localStorage
  private saveUsers(users: User[]): void {
    localStorage.setItem('registered_users', JSON.stringify(users));
  }

  // Generar ID único
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Generar token simple
  private generateToken(userId: string): string {
    return btoa(`${userId}:${Date.now()}:${Math.random()}`);
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    const user = users.find(u => u.email === credentials.email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña (en un caso real estaría hasheada)
    const storedCredentials = localStorage.getItem(`user_${user.id}`);
    if (storedCredentials) {
      const creds = JSON.parse(storedCredentials);
      if (creds.password !== credentials.password) {
        throw new Error('Contraseña incorrecta');
      }
    }

    const token = this.generateToken(user.id);
    
    // Guardar sesión
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('token', token);

    return { user, token };
  }

  // Registro
  async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    
    // Verificar si el email ya existe
    if (users.some(u => u.email === data.email)) {
      throw new Error('El email ya está registrado');
    }

    // Verificar que las contraseñas coincidan
    if (data.password !== data.confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: this.generateId(),
      email: data.email,
      name: data.name,
      createdAt: new Date().toISOString()
    };

    // Guardar usuario
    users.push(newUser);
    this.saveUsers(users);

    // Guardar credenciales (solo para simulación)
    const credentials = {
      email: data.email,
      password: data.password
    };
    localStorage.setItem(`user_${newUser.id}`, JSON.stringify(credentials));

    const token = this.generateToken(newUser.id);
    localStorage.setItem('current_user', JSON.stringify(newUser));
    localStorage.setItem('token', token);

    return { 
      user: newUser, 
      token,
      message: 'Usuario registrado exitosamente'
    };
  }

  // Recuperar contraseña
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    const user = users.find(u => u.email === data.email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return { 
        message: 'Si el email está registrado, recibirás instrucciones' 
      };
    }

    // Generar token de recuperación
    const resetToken = this.generateToken(user.id);
    const resetData = {
      userId: user.id,
      token: resetToken,
      expires: Date.now() + 3600000 // 1 hora
    };
    
    localStorage.setItem(`reset_${user.id}`, JSON.stringify(resetData));
    console.log(`Token de recuperación: ${resetToken}`);

    return { 
      message: 'Se han enviado instrucciones a tu correo' 
    };
  }

  // Resetear contraseña
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    let resetData: any = null;
    let userId: string | null = null;

    // Buscar el token
    for (const user of users) {
      const stored = localStorage.getItem(`reset_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token === data.token) {
          resetData = parsed;
          userId = user.id;
          break;
        }
      }
    }

    if (!resetData || !userId) {
      throw new Error('Token inválido');
    }

    // Verificar expiración
    if (Date.now() > resetData.expires) {
      throw new Error('El token ha expirado');
    }

    // Verificar contraseñas
    if (data.password !== data.confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    // Actualizar contraseña
    const userCredentials = localStorage.getItem(`user_${userId}`);
    if (userCredentials) {
      const creds = JSON.parse(userCredentials);
      creds.password = data.password;
      localStorage.setItem(`user_${userId}`, JSON.stringify(creds));
    }

    // Eliminar token usado
    localStorage.removeItem(`reset_${userId}`);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // Logout
  logout(): void {
    localStorage.removeItem('current_user');
    localStorage.removeItem('token');
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token') && !!this.getCurrentUser();
  }
}

export default new AuthService();