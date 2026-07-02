"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const identity_1 = require("@azure/identity");
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
        const credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
        console.log('Getting Token...');
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        console.log('Token successfully retrieved! Token preview:', token.token.substring(0, 30) + '...');
        console.log('Initializing Graph Client...');
        const graphClient = microsoft_graph_client_1.Client.initWithMiddleware({
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
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
run();
//# sourceMappingURL=test-email.js.map