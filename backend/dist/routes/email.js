"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const identity_1 = require("@azure/identity");
const router = express_1.default.Router();
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const fromEmail = process.env.FROM_EMAIL || 'marrano@ofimundo.cl';
// ✅ Ya no necesitamos ADMIN_EMAIL separado, usamos fromEmail como admin
const adminEmail = fromEmail; // El admin es la misma cuenta que envía los emails
let credential = null;
let graphClient = null;
let graphReady = false;
// Inicializar Graph Client
async function initGraphClient() {
    if (!tenantId || !clientId || !clientSecret) {
        console.log('⚠️  Credenciales de email Microsoft Graph no configuradas en .env');
        graphReady = false;
        return;
    }
    try {
        console.log('🔄 Inicializando Microsoft Graph Client...');
        credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
        await credential.getToken('https://graph.microsoft.com/.default');
        console.log('✅ Token obtenido correctamente');
        graphClient = microsoft_graph_client_1.Client.initWithMiddleware({
            authProvider: {
                getAccessToken: async () => {
                    const result = await credential.getToken('https://graph.microsoft.com/.default');
                    return result.token;
                }
            }
        });
        graphReady = true;
        console.log('✅ Microsoft Graph Client inicializado correctamente');
    }
    catch (error) {
        console.error('❌ Error al inicializar Graph Client:', error.message);
        graphReady = false;
    }
}
// Ejecutar inicialización al cargar
initGraphClient();
// ============================================
// ENDPOINT: ENVIAR EMAIL DE SOLICITUD
// ============================================
router.post('/send-email', async (req, res) => {
    const { to, subject, link, nombreProyecto, nombreSolicitante, area } = req.body;
    console.log(`\n📧 Enviando email al destinatario: ${to}`);
    console.log(`📝 Proyecto: ${nombreProyecto}, Solicitante: ${nombreSolicitante || 'No especificado'}`);
    // Validar datos requeridos
    if (!to || !subject || !link || !nombreProyecto) {
        console.log('❌ Datos incompletos para enviar email');
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos: to, subject, link, nombreProyecto'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando envío');
        console.log(`📧 Link de formulario para ${to}: ${link}`);
        return res.json({
            success: true,
            message: 'Email simulado (Graph API no configurado)',
            simulated: true,
            link
        });
    }
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #0078D4 0%, #00A4EF 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">📋 Solicitud de Proyecto RPA</h2>
        </div>
        <div style="padding: 20px;">
          <p>Se ha generado una solicitud para completar los detalles del proyecto:</p>
          <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
            <p><strong>Solicitante:</strong> ${nombreSolicitante || 'No especificado'}</p>
            <p><strong>Área:</strong> ${area || 'No especificada'}</p>
          </div>
          <p>Complete el formulario haciendo clic aquí:</p>
          <div style="text-align: center; margin: 25px 0;">
              <a href="${link}" style="background: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📝 Completar Formulario</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Si el botón no funciona, copie este enlace: ${link}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    try {
        console.log(`🔄 Enviando email a través de Graph API...`);
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: subject,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        });
        console.log('✅ Email enviado exitosamente a:', to);
        res.json({ success: true, message: 'Email enviado correctamente' });
    }
    catch (error) {
        console.error('❌ Error al enviar email:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: NOTIFICAR AL ADMINISTRADOR
// ✅ CORREGIDO: Ahora envía al mismo fromEmail
// ============================================
router.post('/notify-admin', async (req, res) => {
    const { nombreProyecto, nombreSolicitante, area, link } = req.body;
    console.log(`\n📧 Enviando notificación de completado al administrador...`);
    console.log(`📝 Proyecto: ${nombreProyecto}, Solicitante: ${nombreSolicitante || 'No especificado'}`);
    console.log(`📧 Enviando a la misma cuenta: ${adminEmail}`);
    // Validar datos requeridos
    if (!nombreProyecto) {
        console.log('❌ Datos incompletos para notificar al admin');
        return res.status(400).json({
            success: false,
            error: 'Falta nombreProyecto'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando notificación');
        return res.json({
            success: true,
            message: 'Notificación simulada (Graph API no configurado)',
            simulated: true
        });
    }
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #0078D4 0%, #00A4EF 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">📋 Nueva Solicitud Completada</h2>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px;">¡Hola!</p>
          <p>Se ha completado un nuevo formulario de solicitud de proyecto.</p>
          
          <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #0078D4;">📌 Detalles de la solicitud:</h3>
            <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
            <p><strong>Solicitante:</strong> ${nombreSolicitante || 'No especificado'}</p>
            <p><strong>Área:</strong> ${area || 'No especificada'}</p>
          </div>
          
          <p>Puedes revisar la solicitud completa en el dashboard del sistema.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${link || '#'}" style="background: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📊 Ver en Dashboard</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    try {
        console.log(`🔄 Enviando notificación al admin: ${adminEmail}`);
        // ✅ Enviar a la misma cuenta fromEmail
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: `✅ Nueva solicitud completada: ${nombreProyecto}`,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: adminEmail } }] // adminEmail = fromEmail
            },
            saveToSentItems: true
        });
        console.log('✅ Notificación enviada al administrador');
        res.json({ success: true, message: 'Notificación enviada correctamente' });
    }
    catch (error) {
        console.error('❌ Error al enviar notificación:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: NOTIFICAR APROBACIÓN AL SOLICITANTE
// ============================================
router.post('/notify-aprobado', async (req, res) => {
    const { to, nombreProyecto, nombreSolicitante, comentarios } = req.body;
    console.log(`\n📧 Enviando notificación de APROBACIÓN a: ${to}`);
    console.log(`📝 Proyecto: ${nombreProyecto}, Solicitante: ${nombreSolicitante || 'No especificado'}`);
    // Validar datos requeridos
    if (!to || !nombreProyecto) {
        console.log('❌ Datos incompletos para notificar aprobación');
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos: to, nombreProyecto'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando envío de aprobación');
        return res.json({
            success: true,
            message: 'Notificación simulada (Graph API no configurado)',
            simulated: true
        });
    }
    try {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #4CAF50; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">✅ ¡Solicitud Aprobada!</h2>
            </div>
            <div style="padding: 20px;">
              <p>Estimado/a <strong>${nombreSolicitante || 'colaborador/a'}</strong>,</p>
              <p>Nos complace informarle que su solicitud para el proyecto <strong>${nombreProyecto}</strong> ha sido <strong style="color: #4CAF50;">APROBADA</strong>.</p>
              ${comentarios ? `<p><strong>Comentarios adicionales:</strong> ${comentarios}</p>` : ''}
              <p>El equipo de gestión dará inicio a las siguientes fases del proyecto.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        console.log(`🔄 Enviando notificación de aprobación a: ${to}`);
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: `✅ Solicitud Aprobada: ${nombreProyecto}`,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        });
        console.log('✅ Notificación de APROBACIÓN enviada exitosamente');
        res.json({
            success: true,
            message: 'Notificación de aprobación enviada correctamente'
        });
    }
    catch (error) {
        console.error('❌ Error al enviar notificación de aprobación:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: NOTIFICAR RECHAZO AL SOLICITANTE
// ============================================
router.post('/notify-rechazado', async (req, res) => {
    const { to, nombreProyecto, nombreSolicitante, motivoRechazo, comentarios } = req.body;
    console.log(`\n📧 Enviando notificación de RECHAZO a: ${to}`);
    console.log(`📝 Proyecto: ${nombreProyecto}, Solicitante: ${nombreSolicitante || 'No especificado'}`);
    console.log(`❌ Motivo: ${motivoRechazo || 'No especificado'}`);
    // Validar datos requeridos
    if (!to || !nombreProyecto || !motivoRechazo) {
        console.log('❌ Datos incompletos para notificar rechazo');
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos: to, nombreProyecto, motivoRechazo'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando envío de rechazo');
        return res.json({
            success: true,
            message: 'Notificación simulada (Graph API no configurado)',
            simulated: true
        });
    }
    try {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f44336; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">❌ Solicitud Rechazada</h2>
            </div>
            <div style="padding: 20px;">
              <p>Estimado/a <strong>${nombreSolicitante || 'colaborador/a'}</strong>,</p>
              <p>Lamentamos informarle que su solicitud para el proyecto <strong>${nombreProyecto}</strong> ha sido <strong style="color: #f44336;">RECHAZADA</strong>.</p>
              <p><strong>Motivo del rechazo:</strong> ${motivoRechazo}</p>
              ${comentarios ? `<p><strong>Comentarios adicionales:</strong> ${comentarios}</p>` : ''}
              <p>Si tiene alguna consulta, por favor comuníquese con el equipo de gestión.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        console.log(`🔄 Enviando notificación de rechazo a: ${to}`);
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: `❌ Solicitud Rechazada: ${nombreProyecto}`,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        });
        console.log('✅ Notificación de RECHAZO enviada exitosamente');
        res.json({
            success: true,
            message: 'Notificación de rechazo enviada correctamente'
        });
    }
    catch (error) {
        console.error('❌ Error al enviar notificación de rechazo:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: NOTIFICAR CANCELACIÓN AL SOLICITANTE
// ============================================
router.post('/notify-cancelado', async (req, res) => {
    const { to, nombreProyecto, nombreSolicitante, motivoCancelacion, comentarios } = req.body;
    console.log(`\n📧 Enviando notificación de CANCELACIÓN a: ${to}`);
    console.log(`📝 Proyecto: ${nombreProyecto}, Solicitante: ${nombreSolicitante || 'No especificado'}`);
    console.log(`⛔ Motivo: ${motivoCancelacion || 'No especificado'}`);
    // Validar datos requeridos
    if (!to || !nombreProyecto) {
        console.log('❌ Datos incompletos para notificar cancelación');
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos: to, nombreProyecto'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando envío de cancelación');
        return res.json({
            success: true,
            message: 'Notificación simulada (Graph API no configurado)',
            simulated: true
        });
    }
    try {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #FF9800; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">⛔ Solicitud Cancelada</h2>
            </div>
            <div style="padding: 20px;">
              <p>Estimado/a <strong>${nombreSolicitante || 'colaborador/a'}</strong>,</p>
              <p>Le informamos que la solicitud para el proyecto <strong>${nombreProyecto}</strong> ha sido <strong style="color: #FF9800;">CANCELADA</strong>.</p>
              ${motivoCancelacion ? `<p><strong>Motivo de la cancelación:</strong> ${motivoCancelacion}</p>` : ''}
              ${comentarios ? `<p><strong>Comentarios adicionales:</strong> ${comentarios}</p>` : ''}
              <p>Si tiene alguna consulta, por favor comuníquese con el equipo de gestión.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        console.log(`🔄 Enviando notificación de cancelación a: ${to}`);
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: `⛔ Solicitud Cancelada: ${nombreProyecto}`,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        });
        console.log('✅ Notificación de CANCELACIÓN enviada exitosamente');
        res.json({
            success: true,
            message: 'Notificación de cancelación enviada correctamente'
        });
    }
    catch (error) {
        console.error('❌ Error al enviar notificación de cancelación:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: NOTIFICAR ASIGNACIÓN AL PROFESIONAL
// ============================================
router.post('/notify-asignacion', async (req, res) => {
    const { to, profesionalNombre, nombreProyecto, horasAsignadas, fechaInicio, fechaFin, comentarios } = req.body;
    console.log(`\n📧 Enviando notificación de ASIGNACIÓN a: ${to}`);
    console.log(`📝 Profesional: ${profesionalNombre}, Proyecto: ${nombreProyecto}`);
    if (!to || !profesionalNombre || !nombreProyecto) {
        console.log('❌ Datos incompletos para notificar asignación');
        return res.status(400).json({
            success: false,
            error: 'Faltan datos requeridos'
        });
    }
    if (!graphReady || !graphClient) {
        console.log('⚠️ Graph API no disponible - Simulando notificación de asignación');
        return res.json({
            success: true,
            message: 'Notificación simulada (Graph API no configurado)',
            simulated: true
        });
    }
    try {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0078D4; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #0078D4 0%, #00A4EF 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">📋 Asignación de Proyecto</h2>
            </div>
            <div style="padding: 20px;">
              <p>Estimado/a <strong>${profesionalNombre}</strong>,</p>
              <p>Ha sido asignado/a al proyecto <strong>${nombreProyecto}</strong>.</p>
              <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>📋 Proyecto:</strong> ${nombreProyecto}</p>
                <p><strong>⏱ Horas asignadas:</strong> ${horasAsignadas} horas</p>
                ${fechaInicio ? `<p><strong>📅 Fecha inicio:</strong> ${fechaInicio}</p>` : ''}
                ${fechaFin ? `<p><strong>📅 Fecha fin:</strong> ${fechaFin}</p>` : ''}
                ${comentarios ? `<p><strong>💬 Comentarios:</strong> ${comentarios}</p>` : ''}
              </div>
              <p>Por favor, revise los detalles del proyecto en el dashboard.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
        `;
        console.log(`🔄 Enviando notificación de asignación a: ${to}`);
        await graphClient.api(`/users/${fromEmail}/sendMail`).post({
            message: {
                subject: `📋 Asignación de Proyecto: ${nombreProyecto}`,
                body: { contentType: 'HTML', content: htmlTemplate },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        });
        console.log('✅ Notificación de ASIGNACIÓN enviada exitosamente');
        res.json({
            success: true,
            message: 'Notificación de asignación enviada correctamente'
        });
    }
    catch (error) {
        console.error('❌ Error al enviar notificación de asignación:', error.message);
        if (error.code)
            console.error('📌 Código de error:', error.code);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});
// ============================================
// ENDPOINT: TEST - Verificar estado del servicio
// ============================================
router.get('/test', async (req, res) => {
    const configStatus = {
        tenantId: !!tenantId,
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        fromEmail: fromEmail,
        adminEmail: adminEmail
    };
    console.log('\n🔍 Verificando estado del servicio de email:');
    console.log(`📊 Graph Ready: ${graphReady}`);
    console.log(`📋 Configuración:`, configStatus);
    res.json({
        success: true,
        message: 'Servicio de email funcionando',
        emailConfigurado: graphReady,
        metodo: graphReady ? 'Microsoft Graph API' : 'Simulación',
        config: configStatus,
        timestamp: new Date().toISOString()
    });
});
// ============================================
// ENDPOINT: RECARGAR CONFIGURACIÓN
// ============================================
router.post('/reload', async (req, res) => {
    console.log('\n🔄 Recargando configuración del servicio de email...');
    // Actualizar variables de entorno (en caso de que hayan cambiado)
    const newTenantId = process.env.TENANT_ID;
    const newClientId = process.env.CLIENT_ID;
    const newClientSecret = process.env.CLIENT_SECRET;
    // Verificar si cambiaron las credenciales
    if (newTenantId !== tenantId || newClientId !== clientId || newClientSecret !== clientSecret) {
        console.log('⚠️ Las credenciales han cambiado, reinicializando Graph Client...');
        // Reasignar variables
        tenantId = newTenantId;
        clientId = newClientId;
        clientSecret = newClientSecret;
        // Reinicializar
        await initGraphClient();
    }
    res.json({
        success: true,
        message: 'Configuración recargada',
        graphReady: graphReady,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=email.js.map