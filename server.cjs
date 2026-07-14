// C:\proyectos\Gestion_Proyectos\server.cjs
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CONFIGURACIÓN CORS
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// CONFIGURACIÓN DE MICROSOFT GRAPH API
// ============================================
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const fromEmail = process.env.FROM_EMAIL || 'marrano@ofimundo.cl';
const adminEmail = process.env.ADMIN_EMAIL || 'marrano@ofimundo.cl';

// Validar variables
if (!tenantId || !clientId || !clientSecret) {
  console.error('❌ ERROR: Faltan variables de entorno');
  console.error('   Asegúrate de que .env tenga: TENANT_ID, CLIENT_ID, CLIENT_SECRET');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas');
console.log(`   Tenant ID: ${tenantId.substring(0, 8)}...`);
console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
console.log(`   From Email: ${fromEmail}`);
console.log(`   Admin Email: ${adminEmail}`);

// Credenciales
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
let graphClient = null;
let graphReady = false;

// Inicializar Graph Client
async function initGraphClient() {
  try {
    console.log('🔄 Inicializando Microsoft Graph Client...');
    const token = await credential.getToken('https://graph.microsoft.com/.default');
    console.log('✅ Token obtenido correctamente');
    
    graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const result = await credential.getToken('https://graph.microsoft.com/.default');
          return result.token;
        }
      }
    });
    
    graphReady = true;
    console.log('✅ Microsoft Graph Client inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar Graph Client:', error.message);
    graphReady = false;
    return false;
  }
}

// ============================================
// ENDPOINT PARA ENVIAR NOTIFICACIÓN AL ADMINISTRADOR
// ============================================
app.post('/api/notify-admin', async (req, res) => {
  const { nombreProyecto, nombreSolicitante, area, link } = req.body;
  
  console.log('\n📧 Enviando notificación al administrador...');
  console.log(`   Proyecto: ${nombreProyecto}`);
  console.log(`   Solicitante: ${nombreSolicitante}`);
  console.log(`   Área: ${area}`);
  
  if (!graphReady || !graphClient) {
    console.log('⚠️ Graph API no disponible');
    return res.status(500).json({
      success: false,
      message: 'Graph API no disponible. Verifica tus credenciales.'
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
            <a href="${link}" style="background: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">📊 Ver en Dashboard</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await graphClient.api(`/users/${fromEmail}/sendMail`).post({
      message: {
        subject: `✅ Nueva solicitud completada: ${nombreProyecto}`,
        body: { contentType: 'HTML', content: htmlTemplate },
        toRecipients: [{ emailAddress: { address: adminEmail } }]
      },
      saveToSentItems: true
    });
    
    console.log('✅ Notificación enviada al administrador');
    res.json({ success: true, message: 'Notificación enviada' });
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENDPOINT PARA ENVIAR EMAIL AL DESTINATARIO
// ============================================
app.post('/api/send-email', async (req, res) => {
  console.log('\n📧 Enviando email al destinatario:', req.body.to);
  console.log(`   Proyecto: ${req.body.nombreProyecto}`);
  
  const { to, subject, link, nombreProyecto, nombreSolicitante, area } = req.body;
  
  if (!graphReady || !graphClient) {
    console.log('⚠️ Graph API no disponible');
    return res.status(500).json({
      success: false,
      message: 'Graph API no disponible. Verifica tus credenciales.'
    });
  }
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0078D4;">📋 Solicitud de Proyecto</h2>
        <p>Se ha generado una solicitud para el proyecto:</p>
        <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
          <p><strong>Solicitante:</strong> ${nombreSolicitante || 'No especificado'}</p>
          <p><strong>Área:</strong> ${area || 'No especificada'}</p>
        </div>
        <p>Complete el formulario haciendo clic aquí:</p>
        <a href="${link}" style="background: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">📝 Completar Formulario</a>
        <p style="margin-top: 20px; font-size: 12px;">O copie este enlace: ${link}</p>
      </div>
    </body>
    </html>
  `;
  
  try {
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
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENDPOINTS PARA APROBACIÓN Y RECHAZO
// ============================================

// Endpoint para notificar APROBACIÓN al solicitante
app.post('/api/notify-aprobado', async (req, res) => {
  const { to, nombreProyecto, nombreSolicitante, comentarios } = req.body;
  
  console.log('\n📧 Enviando notificación de APROBACIÓN...');
  console.log(`   Para: ${to}`);
  console.log(`   Proyecto: ${nombreProyecto}`);
  console.log(`   Solicitante: ${nombreSolicitante}`);
  
  // Responder inmediatamente para no bloquear al frontend
  res.json({ success: true, message: 'Notificación de aprobación recibida' });
  
  // Procesar en segundo plano
  if (graphReady && graphClient) {
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
              <p>El equipo de gestión dará inicio a las siguientes fases del proyecto.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await graphClient.api(`/users/${fromEmail}/sendMail`).post({
        message: {
          subject: `✅ Solicitud Aprobada: ${nombreProyecto}`,
          body: { contentType: 'HTML', content: htmlTemplate },
          toRecipients: [{ emailAddress: { address: to } }]
        },
        saveToSentItems: true
      });
      
      console.log('✅ Notificación de APROBACIÓN enviada a:', to);
    } catch (error) {
      console.error('❌ Error al enviar notificación de aprobación:', error.message);
    }
  } else {
    console.log('⚠️ Graph API no disponible, no se envió notificación real');
  }
});

// Endpoint para notificar RECHAZO al solicitante
app.post('/api/notify-rechazado', async (req, res) => {
  const { to, nombreProyecto, nombreSolicitante, motivoRechazo, comentarios } = req.body;
  
  console.log('\n📧 Enviando notificación de RECHAZO...');
  console.log(`   Para: ${to}`);
  console.log(`   Proyecto: ${nombreProyecto}`);
  console.log(`   Motivo: ${motivoRechazo}`);
  
  // Responder inmediatamente para no bloquear al frontend
  res.json({ success: true, message: 'Notificación de rechazo recibida' });
  
  // Procesar en segundo plano
  if (graphReady && graphClient) {
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
              <p>Si tiene alguna consulta, por favor comuníquese con el equipo de gestión.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático del Sistema de Gestión de Proyectos RPA.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await graphClient.api(`/users/${fromEmail}/sendMail`).post({
        message: {
          subject: `❌ Solicitud Rechazada: ${nombreProyecto}`,
          body: { contentType: 'HTML', content: htmlTemplate },
          toRecipients: [{ emailAddress: { address: to } }]
        },
        saveToSentItems: true
      });
      
      console.log('✅ Notificación de RECHAZO enviada a:', to);
    } catch (error) {
      console.error('❌ Error al enviar notificación de rechazo:', error.message);
    }
  } else {
    console.log('⚠️ Graph API no disponible, no se envió notificación real');
  }
});

// ============================================
// ENDPOINT DE PRUEBA
// ============================================
app.get('/api/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    emailConfigurado: graphReady,
    metodo: graphReady ? 'Microsoft Graph API' : 'No disponible',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ENDPOINT DE SIMULACIÓN
// ============================================
app.post('/api/simulate-email', (req, res) => {
  const { to, subject, link, nombreProyecto } = req.body;
  console.log('📧 SIMULADO - Email a:', to);
  res.json({ success: true, message: 'Email simulado', simulated: true });
});

// ============================================
// LISTAR TODOS LOS ENDPOINTS REGISTRADOS (para depuración)
// ============================================
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json(routes);
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Servidor con Microsoft Graph API                  ║
║                                                          ║
║     📡 Puerto: ${PORT}                                       ║
║     📧 Endpoints:                                        ║
║        POST /api/send-email                              ║
║        POST /api/notify-admin                            ║
║        POST /api/notify-aprobado ✅                      ║
║        POST /api/notify-rechazado ✅                     ║
║        GET  /api/test                                    ║
║        GET  /api/routes (para depuración)                ║
║                                                          ║
║     📧 Configuración:                                    ║
║        - Método: Microsoft Graph API                     ║
║        - Tenant ID: ${tenantId ? '✅' : '❌'}
║        - Client ID: ${clientId ? '✅' : '❌'}
║        - Client Secret: ${clientSecret ? '✅' : '❌'}
║        - Admin Email: ${adminEmail}
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  // Inicializar Graph API después de iniciar el servidor
  initGraphClient();
});