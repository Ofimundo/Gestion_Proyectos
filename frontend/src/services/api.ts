import axios from 'axios';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Definir la interfaz para la respuesta de error personalizada
interface ErrorResponse {
  message?: string;
  errors?: any[];
}

// Obtener la URL de la API con validación
const getApiUrl = (): string => {
  // Verificar si import.meta.env existe y tiene VITE_API_URL
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error en interceptor de request:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    // Manejar errores de red o sin respuesta
    if (!error.response) {
      console.error('Error de red:', error.message);
      return Promise.reject({
        message: 'Error de conexión. Verifica tu internet.',
        originalError: error
      });
    }

    const { status, data } = error.response;

    // Manejar errores según el código de estado
    switch (status) {
      case 400:
        console.error('Error 400 - Bad Request:', data);
        break;
        
      case 401:
        console.error('Error 401 - No autorizado');
        // Limpiar localStorage y redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
        
      case 403:
        console.error('Error 403 - Prohibido');
        break;
        
      case 404:
        console.error('Error 404 - No encontrado:', data);
        break;
        
      case 500:
        console.error('Error 500 - Error del servidor:', data);
        break;
        
      default:
        console.error(`Error ${status}:`, data);
    }

    return Promise.reject(error);
  }
);

// Detectar entorno de desarrollo sin usar process.env
const isDevelopment = (): boolean => {
  // Verificar si estamos en desarrollo (puedes usar import.meta.env.MODE en Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) {
    return import.meta.env.MODE === 'development';
  }
  // Fallback: asumir desarrollo si no hay información
  return true;
};

// Agregar un interceptor para logging en desarrollo
if (isDevelopment()) {
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
      return config;
    },
    (error: AxiosError) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    (error: AxiosError<ErrorResponse>) => {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
}

export default api;