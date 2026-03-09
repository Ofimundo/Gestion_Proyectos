"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const uuid_1 = require("uuid");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuración de la base de datos SQLite
async function getDb() {
    return (0, sqlite_1.open)({
        filename: './database.sqlite',
        driver: sqlite3_1.default.Database
    });
}
// Inicializar base de datos - SIN USUARIOS PREDETERMINADOS
async function initializeDatabase() {
    const db = await getDb();
    // Eliminar tablas si existen (para pruebas)
    await db.exec(`DROP TABLE IF EXISTS users`);
    await db.exec(`DROP TABLE IF EXISTS reset_tokens`);
    // Crear tablas con la estructura correcta
    await db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      empresa TEXT,
      role TEXT DEFAULT 'user',
      fechaRegistro TEXT NOT NULL,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE reset_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (email) REFERENCES users(email)
    );
  `);
    console.log('✅ Base de datos inicializada correctamente');
    console.log('📌 No se crearon usuarios predeterminados');
}
initializeDatabase().catch(console.error);
// ============================================
// CONFIGURACIÓN DE CORREO (OPCIONAL)
// ============================================
function getTransporterConfig() {
    const email = process.env.EMAIL_USER || '';
    // Detectar automáticamente el proveedor basado en el email
    if (email.includes('gmail.com')) {
        console.log('📧 Configuración detectada: GMAIL');
        return {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: email,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
    }
    else if (email.includes('outlook.com') || email.includes('hotmail.com')) {
        console.log('📧 Configuración detectada: OUTLOOK/HOTMAIL');
        return {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: {
                user: email,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
    }
    else if (email.includes('yahoo.com')) {
        console.log('📧 Configuración detectada: YAHOO');
        return {
            host: 'smtp.mail.yahoo.com',
            port: 465,
            secure: true,
            auth: {
                user: email,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
    }
    else {
        // Configuración personalizada para otros dominios
        console.log('📧 Usando configuración personalizada');
        return {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: email,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
    }
}
// Crear transporter con la configuración adecuada (solo si hay credenciales)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        transporter = nodemailer_1.default.createTransport(getTransporterConfig());
        console.log('✅ Transporter creado correctamente');
        // Verificar conexión
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Error de conexión con el servidor de correo:');
                console.error(`   Código: ${error.message}`);
                console.log('📌 El sistema funcionará sin envío de correos');
            }
            else {
                console.log('✅ Servidor de correo listo para enviar mensajes');
            }
        });
    }
    catch (error) {
        console.error('❌ Error creando transporter:', error);
        transporter = null;
    }
}
else {
    console.log('⚠️  Correo no configurado - Usando modo de recuperación directa');
}
// Middleware para validar errores
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================
// Registro de usuario
app.post('/api/register', [
    (0, express_validator_1.body)('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    (0, express_validator_1.body)('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], validate, async (req, res) => {
    try {
        const { nombre, username, email, password, empresa } = req.body;
        const db = await getDb();
        // Verificar si el email ya existe
        const existingEmail = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }
        // Verificar si el username ya existe
        const existingUsername = await db.get('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }
        // Hash de la contraseña
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Crear usuario
        const userId = (0, uuid_1.v4)();
        await db.run('INSERT INTO users (id, nombre, username, email, password, empresa, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, nombre, username.toLowerCase(), email.toLowerCase(), hashedPassword, empresa || '', new Date().toISOString()]);
        return res.json({
            success: true,
            message: 'Usuario registrado exitosamente'
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
});
// Login - PUEDE SER POR EMAIL O USERNAME
app.post('/api/login', [
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email o usuario requerido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('La contraseña es obligatoria')
], validate, async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDb();
        // Buscar usuario por email O username
        const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email.toLowerCase(), email.toLowerCase()]);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        // Verificar contraseña
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        // Generar token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                username: user.username,
                email: user.email,
                role: user.role,
                empresa: user.empresa
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});
// ============================================
// ENDPOINTS PARA RECUPERACIÓN POR USUARIO
// ============================================
// Verificar si el usuario existe (por nombre, username o email)
app.post('/api/check-username', [(0, express_validator_1.body)('username').notEmpty().withMessage('Usuario requerido')], validate, async (req, res) => {
    try {
        const { username } = req.body;
        const db = await getDb();
        // Buscar usuario por nombre, username o email (case insensitive)
        const user = await db.get('SELECT * FROM users WHERE LOWER(nombre) = LOWER(?) OR LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)', [username, username, username]);
        return res.json({
            success: true,
            exists: !!user,
            nombre: user?.nombre || null
        });
    }
    catch (error) {
        console.error('Error verificando usuario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar usuario'
        });
    }
});
// Resetear contraseña por nombre de usuario
app.post('/api/reset-password-by-username', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Usuario requerido'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], validate, async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        const db = await getDb();
        // Buscar usuario por nombre, username o email
        const user = await db.get('SELECT * FROM users WHERE LOWER(nombre) = LOWER(?) OR LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)', [username, username, username]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Actualizar contraseña
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        console.log(`✅ Contraseña actualizada para usuario: ${user.nombre} (${user.email})`);
        return res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error restableciendo contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
});
// ============================================
// ENDPOINTS DE RECUPERACIÓN TRADICIONAL (CON CORREO)
// ============================================
// Solicitar recuperación de contraseña (con correo)
app.post('/api/forgot-password', [(0, express_validator_1.body)('email').isEmail().withMessage('Email inválido')], validate, async (req, res) => {
    try {
        const { email } = req.body;
        const db = await getDb();
        // Buscar usuario
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!user) {
            // Por seguridad, no revelamos si el email existe
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones'
            });
        }
        // Si no hay transporter configurado, usar modo directo
        if (!transporter) {
            // Generar token para compatibilidad
            const resetToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            await db.run('INSERT INTO reset_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)', [(0, uuid_1.v4)(), email.toLowerCase(), resetToken, expiresAt.toISOString()]);
            const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
            console.log('📧 Modo desarrollo - Link de recuperación:', resetLink);
            return res.json({
                success: true,
                message: 'Correo de recuperación enviado (modo desarrollo)',
                devLink: resetLink
            });
        }
        // Generar token único
        const resetToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        // Guardar token en base de datos
        await db.run('INSERT INTO reset_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)', [(0, uuid_1.v4)(), email.toLowerCase(), resetToken, expiresAt.toISOString()]);
        // Link de recuperación
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        // Configurar el correo
        const mailOptions = {
            from: `"RPA Manager" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperación de contraseña - RPA Manager',
            html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:20px auto; background-color:#ffffff; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">RPA Manager</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin-top: 0; font-size: 24px;">Recuperación de contraseña</h2>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Restablecer contraseña</a>
                  </div>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                  <p style="color: #666; line-height: 1.6; font-size: 14px;">El enlace expirará en 1 hora por seguridad.</p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                  <p style="color: #999; font-size: 12px; text-align: center;">© 2024 RPA Manager. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
        };
        // Enviar el correo
        await transporter.sendMail(mailOptions);
        return res.json({
            success: true,
            message: 'Correo de recuperación enviado'
        });
    }
    catch (error) {
        console.error('Error enviando correo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al enviar el correo'
        });
    }
});
// Restablecer contraseña con token (método tradicional)
app.post('/api/reset-password', [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Token requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], validate, async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;
        const db = await getDb();
        // Verificar token
        const resetToken = await db.get('SELECT * FROM reset_tokens WHERE email = ? AND token = ? AND used = 0 AND expires_at > ?', [email.toLowerCase(), token, new Date().toISOString()]);
        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Actualizar contraseña
        await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);
        // Marcar token como usado
        await db.run('UPDATE reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);
        return res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error restableciendo contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
});
// ============================================
// ENDPOINTS DE USUARIOS
// ============================================
// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT id, nombre, username, email, empresa, role, fechaRegistro, activo FROM users');
        return res.json({ success: true, users });
    }
    catch (error) {
        console.error('Error obteniendo usuarios:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});
// Actualizar perfil de usuario
app.put('/api/users/:id', [
    (0, express_validator_1.body)('nombre').optional().notEmpty(),
    (0, express_validator_1.body)('username').optional().notEmpty(),
    (0, express_validator_1.body)('empresa').optional(),
    (0, express_validator_1.body)('password').optional().isLength({ min: 6 })
], validate, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, username, empresa, password } = req.body;
        const db = await getDb();
        const updates = [];
        const values = [];
        if (nombre) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (username) {
            // Verificar que el username no esté en uso por otro usuario
            const existingUser = await db.get('SELECT * FROM users WHERE username = ? AND id != ?', [username.toLowerCase(), id]);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }
            updates.push('username = ?');
            values.push(username.toLowerCase());
        }
        if (empresa !== undefined) {
            updates.push('empresa = ?');
            values.push(empresa);
        }
        if (password) {
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
        }
        values.push(id);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        return res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    }
    catch (error) {
        console.error('Error actualizando usuario:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});
// ============================================
// ENDPOINTS DE DIAGNÓSTICO
// ============================================
// Endpoint de prueba
app.get('/api/test', (req, res) => {
    return res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        emailConfigurado: !!process.env.EMAIL_USER,
        modoRecuperacion: 'POR USUARIO (recomendado)'
    });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📧 Email configurado: ${process.env.EMAIL_USER ? 'SÍ' : 'NO'}`);
    console.log(`🔐 Modo recuperación: POR USUARIO (recomendado)`);
    console.log(`========================================\n`);
    console.log(`📌 ENDPOINTS DISPONIBLES:`);
    console.log(`   POST  /api/register - Registro de usuarios (con username)`);
    console.log(`   POST  /api/login - Inicio de sesión (email o username)`);
    console.log(`   POST  /api/check-username - Verificar si usuario existe (nombre, username o email)`);
    console.log(`   POST  /api/reset-password-by-username - Cambiar contraseña por usuario`);
    console.log(`   POST  /api/forgot-password - Solicitar recuperación (CON CORREO)`);
    console.log(`   POST  /api/reset-password - Restablecer con token (CON CORREO)`);
    console.log(`   GET   /api/users - Listar usuarios`);
    console.log(`   GET   /api/test - Prueba de servidor`);
    console.log(`========================================`);
    console.log(`\n📌 BASE DE DATOS: SIN usuarios predeterminados`);
    console.log(`   El primer usuario que registres será el único.`);
    console.log(`========================================\n`);
});
