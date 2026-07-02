// src/services/emailService.ts
import api from './api';

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  link?: string;
  nombreProyecto?: string;
  nombreSolicitante?: string;
  area?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  simulated?: boolean;
}

// Servicio de email para PRODUCCIÓN
const emailService = {
  // ============================================
  // ENDPOINTS PRINCIPALES
  // ============================================

  /**
   * Enviar email genérico usando la API
   */
  sendEmail: async (data: EmailData): Promise<EmailResponse> => {
    console.log('📧 Enviando email a backend:', data);
    
    try {
      const response = await api.post('/send-email', {
        to: data.to,
        subject: data.subject,
        link: data.link,
        nombreProyecto: data.nombreProyecto,
        nombreSolicitante: data.nombreSolicitante,
        area: data.area,
        message: data.message
      });
      
      const result = response.data;
      
      if (result.success) {
        console.log('✅ Email enviado exitosamente');
        return {
          success: true,
          message: result.message || 'Email enviado exitosamente',
          simulated: result.simulated || false
        };
      } else {
        console.error('❌ Error del backend:', result.message);
        return {
          success: false,
          message: result.message || 'Error al enviar email'
        };
      }
    } catch (error: any) {
      console.error('❌ Error de conexión con el backend:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error de conexión con el servidor'
      };
    }
  },

  /**
   * Enviar email con el link del formulario al solicitante
   */
  sendFormularioEmail: async (
    email: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    area: string,
    link: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando formulario a:', email);
      
      const response = await api.post('/send-email', {
        to: email,
        subject: `📋 Formulario de Solicitud - ${nombreProyecto}`,
        link: link,
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        area: area
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Formulario enviado exitosamente',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando formulario:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar formulario'
      };
    }
  },

  /**
   * ✅ ACTUALIZADO: Enviar confirmación de registro al solicitante
   * Ahora notifica al admin usando el email fromEmail
   */
  sendConfirmacionRegistro: async (
    email: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    area: string,
    _descripcion: string,
    _presupuesto: number
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando confirmación de registro a:', email);
      
      // Primero enviar confirmación al solicitante
      const response = await api.post('/send-email', {
        to: email,
        subject: `✅ Solicitud creada: ${nombreProyecto}`,
        link: `${window.location.origin}/solicitud-proyecto`,
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        area: area,
        message: `Tu solicitud ha sido creada exitosamente.`
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Confirmación enviada correctamente',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando confirmación:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar confirmación'
      };
    }
  },

  /**
   * ✅ NUEVO: Notificar al administrador que el formulario fue completado
   * El email se envía desde la misma cuenta fromEmail a la misma cuenta fromEmail (admin)
   */
  sendNotificacionCompletado: async (
    fromEmail: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    area: string,
    linkDashboard: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando notificación de completado al admin (desde y hacia la misma cuenta):', fromEmail);
      
      // ✅ El email se envía a la misma cuenta fromEmail (que es el admin)
      const response = await api.post('/notify-admin', {
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        area: area,
        link: linkDashboard
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Notificación enviada al administrador',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando notificación al admin:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar notificación'
      };
    }
  },

  // ============================================
  // NOTIFICACIONES DE ESTADO
  // ============================================

  /**
   * Enviar notificación de APROBACIÓN al solicitante
   */
  sendAprobacionNotification: async (
    email: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    comentarios?: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando notificación de APROBACIÓN a:', email);
      
      const response = await api.post('/notify-aprobado', {
        to: email,
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        comentarios: comentarios || 'El proyecto ha sido aprobado para su ejecución.'
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Notificación de aprobación enviada',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando notificación de aprobación:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar notificación'
      };
    }
  },

  /**
   * Enviar notificación de RECHAZO al solicitante
   */
  sendRechazoNotification: async (
    email: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    motivoRechazo: string,
    comentarios?: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando notificación de RECHAZO a:', email);
      
      const response = await api.post('/notify-rechazado', {
        to: email,
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        motivoRechazo: motivoRechazo,
        comentarios: comentarios || ''
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Notificación de rechazo enviada',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando notificación de rechazo:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar notificación'
      };
    }
  },

  /**
   * Enviar notificación de CANCELACIÓN al solicitante
   */
  sendCancelacionNotification: async (
    email: string,
    nombreProyecto: string,
    nombreSolicitante: string,
    motivoCancelacion: string,
    comentarios?: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando notificación de CANCELACIÓN a:', email);
      
      const response = await api.post('/notify-cancelado', {
        to: email,
        nombreProyecto: nombreProyecto,
        nombreSolicitante: nombreSolicitante,
        motivoCancelacion: motivoCancelacion,
        comentarios: comentarios || ''
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Notificación de cancelación enviada',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando notificación de cancelación:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar notificación'
      };
    }
  },

  /**
   * Enviar notificación de ASIGNACIÓN a un profesional
   */
  sendAsignacionNotification: async (
    email: string,
    profesionalNombre: string,
    nombreProyecto: string,
    horasAsignadas: number,
    fechaInicio?: string,
    fechaFin?: string,
    comentarios?: string
  ): Promise<EmailResponse> => {
    try {
      console.log('📧 Enviando notificación de ASIGNACIÓN a:', email);
      
      const response = await api.post('/notify-asignacion', {
        to: email,
        profesionalNombre,
        nombreProyecto,
        horasAsignadas,
        fechaInicio: fechaInicio || '',
        fechaFin: fechaFin || '',
        comentarios: comentarios || ''
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Notificación de asignación enviada',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando notificación de asignación:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar notificación'
      };
    }
  },

  // ============================================
  // EMAILS ADICIONALES
  // ============================================

  /**
   * Enviar email de recuperación de contraseña
   */
  sendRecuperacionEmail: async (
    email: string,
    nombre: string,
    resetLink: string
  ): Promise<EmailResponse> => {
    try {
      const response = await api.post('/send-recuperacion', {
        to: email,
        nombre,
        resetLink
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Email de recuperación enviado',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando email de recuperación:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar email de recuperación'
      };
    }
  },

  /**
   * Enviar email de bienvenida
   */
  sendBienvenidaEmail: async (
    email: string,
    nombre: string
  ): Promise<EmailResponse> => {
    try {
      const response = await api.post('/send-bienvenida', {
        to: email,
        nombre
      });
      
      return {
        success: response.data.success,
        message: response.data.message || 'Email de bienvenida enviado',
        simulated: response.data.simulated || false
      };
    } catch (error: any) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al enviar email de bienvenida'
      };
    }
  },

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  /**
   * Generar token único para el formulario
   */
  generateFormToken: (solicitudId: string): string => {
    return btoa(`${solicitudId}-${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9]/g, '');
  },

  /**
   * Validar formato de email
   */
  validateEmail: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Verificar el estado del servicio de email
   */
  testEmailService: async (): Promise<EmailResponse> => {
    try {
      const response = await api.get('/test');
      return {
        success: true,
        message: response.data.message || 'Servicio funcionando correctamente',
        simulated: !response.data.emailConfigurado,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Error verificando servicio de email:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al verificar servicio'
      };
    }
  },

  /**
   * Recargar configuración del servicio de email
   */
  reloadEmailService: async (): Promise<EmailResponse> => {
    try {
      const response = await api.post('/reload');
      return {
        success: response.data.success,
        message: response.data.message || 'Configuración recargada',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Error recargando configuración:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Error al recargar configuración'
      };
    }
  }
};

export default emailService;