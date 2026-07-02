import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const fromEmail = process.env.FROM_EMAIL || 'marrano@ofimundo.cl';

console.log('Parameters loaded:');
console.log('TENANT_ID:', tenantId);
console.log('CLIENT_ID:', clientId);
console.log('CLIENT_SECRET:', clientSecret ? '********' : 'undefined');
console.log('FROM_EMAIL:', fromEmail);

async function run() {
  if (!tenantId || !clientId || !clientSecret) {
    console.error('Missing credentials in .env!');
    return;
  }
  try {
    console.log('Initializing ClientSecretCredential...');
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    console.log('Getting Token...');
    const token = await credential.getToken('https://graph.microsoft.com/.default');
    console.log('Token successfully retrieved! Token preview:', token.token.substring(0, 30) + '...');
    
    console.log('Initializing Graph Client...');
    const graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => token.token
      }
    });
    
    console.log('Sending test email to fromEmail...');
    await graphClient.api(`/users/${fromEmail}/sendMail`).post({
      message: {
        subject: 'Prueba de Inicialización Microsoft Graph API',
        body: { contentType: 'HTML', content: '<h3>Hola</h3><p>Esta es una prueba de envío de correo exitosa desde Microsoft Graph.</p>' },
        toRecipients: [{ emailAddress: { address: fromEmail } }]
      },
      saveToSentItems: true
    });
    console.log('✅ Email sent successfully!');
  } catch (error: any) {
    console.error('❌ Error:', error);
  }
}

run();
