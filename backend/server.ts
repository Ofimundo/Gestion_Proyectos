// C:\proyectos\Gestion_Proyectos\backend\src\server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuración de Microsoft Graph
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const fromEmail = process.env.FROM_EMAIL;

let graphClient: any = null;
let emailConfigurado = false;

// Base de datos en memoria (para ejemplo - reemplazar con DB real)
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

let users: User[] = [];

// Inicializar Graph
async function initGraph() {
  if (!tenantId || !clientId || !clientSecret) {
    console.log('⚠️  Credenciales de email no configuradas');
    emailConfigurado = false;
    return;
  }

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    await credential.getToken('https://graph.microsoft.com/.default');
    
    graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const result = await credential.getToken('https://graph.microsoft.com/.default');
          return result.token;
        }
      }
    });
    
    emailConfigurado = true;
    console.log('✅ Email configurado correctamente');
  } catch (error: any) {
    console.error('❌ Error configurando email:', error.message);
    emailConfigurado = false;
  }
}

// ============================================
// ENDPOINTS DE AUTENTICACIÓN Y USUARIOS
// ============================================

// Registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }
    
    // Verificar si usuario ya existe
    const userExists = users.find(u => u.username === username || u.email === email);
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Usuario o email ya existe' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    res.json({ 
      success: true, 
      message: 'Usuario registrado exitosamente',
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }
    
    // Buscar usuario por email o username
    const user = users.find(u => u.email === emailOrUsername || u.username === emailOrUsername);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    
    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    
    res.json({ 
      success: true, 
      message: 'Login exitoso',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verificar si usuario existe
app.post('/api/check-username', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    let user = null;
    if (username) {
      user = users.find(u => u.username === username);
    } else if (email) {
      user = users.find(u => u.email === email);
    }
    
    res.json({ 
      success: true, 
      exists: !!user,
      user: user ? { username: user.username, email: user.email } : null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cambiar contraseña por usuario (sin email)
app.post('/api/reset-password-by-username', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }
    
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Solicitar recuperación por email (forgot password)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email no registrado' });
    }
    
    // Generar token de recuperación
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    
    // Si el email está configurado, enviar correo
    if (emailConfigurado) {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      await graphClient.api(`/users/${fromEmail}/sendMail`).post({
        message: {
          subject: 'Recuperación de Contraseña',
          body: {
            contentType: 'HTML',
            content: `
              <h2>Recuperación de Contraseña</h2>
              <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
              <a href="${resetLink}">${resetLink}</a>
              <p>Este enlace expirará en 1 hora.</p>
            `
          },
          toRecipients: [{ emailAddress: { address: email } }]
        }
      });
      
      res.json({ success: true, message: 'Email de recuperación enviado' });
    } else {
      // Modo recuperación por usuario - devolver token directamente
      res.json({ 
        success: true, 
        message: 'Modo recuperación por usuario',
        resetToken: resetToken,
        note: 'Email no configurado - Usa este token para recuperar'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restablecer contraseña con token
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos' });
    }
    
    const user = users.find(u => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > new Date());
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar usuarios
app.get('/api/users', async (req, res) => {
  try {
    const userList = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt
    }));
    res.json({ success: true, users: userList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ENDPOINTS DE EMAIL PARA SOLICITUDES
// ============================================

// Endpoint para enviar email de solicitud de proyecto
app.post('/api/send-email', async (req, res) => {
  const { to, subject, link, nombreProyecto, nombreSolicitante, area } = req.body;
  
  if (!emailConfigurado) {
    return res.status(503).json({ 
      success: false, 
      message: 'Servicio de email no disponible. Usa el modo de recuperación por usuario.',
      modoRecuperacion: 'POR USUARIO'
    });
  }
  
  console.log(`📧 Enviando email a: ${to}`);
  console.log(`📋 Proyecto: ${nombreProyecto}`);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #6B7280; text-align: center; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Solicitud de Proyecto</h2>
        </div>
        <div class="content">
          <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
          <p><strong>Solicitante:</strong> ${nombreSolicitante || 'No especificado'}</p>
          <p><strong>Área:</strong> ${area || 'No especificada'}</p>
          <p>Se ha creado un formulario para completar los detalles del proyecto.</p>
          <p>Por favor, haz clic en el siguiente botón para completar la solicitud:</p>
          <div style="text-align: center;">
            <a href="${link}" class="button">Completar Formulario</a>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
            Este enlace es único para esta solicitud.
          </p>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await graphClient.api(`/users/${fromEmail}/sendMail`).post({
      message: {
        subject: subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }]
      },
      saveToSentItems: true
    });
    console.log('✅ Email enviado exitosamente');
    res.json({ success: true, message: 'Email enviado correctamente' });
  } catch (error: any) {
    console.error('❌ Error enviando email:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al enviar el email',
      error: error.message 
    });
  }
});

// Endpoint de prueba del servidor
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    emailConfigurado: emailConfigurado,
    modoRecuperacion: emailConfigurado ? "EMAIL CONFIGURADO" : "POR USUARIO (recomendado)",
    usersCount: users.length
  });
});

// Endpoint para verificar salud del servidor
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, async () => {
  console.log('\n🚀 ========================================');
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📧 Email configurado: ${emailConfigurado ? 'SÍ' : 'NO'}`);
  console.log(`🔐 Modo recuperación: ${emailConfigurado ? 'EMAIL' : 'POR USUARIO (recomendado)'}`);
  console.log('========================================\n');
  
  console.log('📌 ENDPOINTS DISPONIBLES:');
  console.log('   POST  /api/register - Registro de usuarios');
  console.log('   POST  /api/login - Inicio de sesión');
  console.log('   POST  /api/check-username - Verificar usuario');
  console.log('   POST  /api/reset-password-by-username - Cambiar contraseña por usuario');
  console.log('   POST  /api/forgot-password - Solicitar recuperación');
  console.log('   POST  /api/reset-password - Restablecer con token');
  console.log('   POST  /api/send-email - Enviar email de solicitud');
  console.log('   GET   /api/users - Listar usuarios');
  console.log('   GET   /api/test - Prueba de servidor');
  console.log('   GET   /health - Salud del servidor');
  console.log('========================================\n');
  
  // Inicializar Graph
  await initGraph();
  
  if (!emailConfigurado) {
    console.log('⚠️  El servicio de email NO está configurado.');
    console.log('   Las solicitudes de recuperación usarán el modo por usuario.\n');
  } else {
    console.log('✅ Email configurado correctamente. Los emails se enviarán de forma real.\n');
  }
});