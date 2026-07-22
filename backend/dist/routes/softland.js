"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const auth_1 = require("../middleware/auth");
const mssql_1 = __importDefault(require("mssql"));
const router = express_1.default.Router();
// OBTENER CLIENTES (con búsqueda y comercial asignado)
router.get('/clientes', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDatabase)();
        const search = req.query.q ? String(req.query.q) : '';
        let query = `
            SELECT clnt.CodAux, clnt.RutAux, RTRIM(clnt.NomAux) as NomAux, 
                   csm.VenCod, RTRIM(csm.VenDes) as VenDes, RTRIM(csm.EMail) as VenEmail
            FROM STUEDEMANNSA.softland.cwtauxi as clnt
            LEFT JOIN STUEDEMANNSA.softland.cwtauxven AS VnCl ON ( VnCl.CodAux = clnt.CodAux )
            LEFT JOIN STUEDEMANNSA.softland.cwtvend AS csm ON ( csm.VenCod = VnCl.VenCod )
            WHERE clnt.ClaCli = 'S'
        `;
        const request = db.request();
        if (search) {
            query += ` AND (clnt.NomAux LIKE @Search OR clnt.CodAux LIKE @Search OR clnt.RutAux LIKE @Search)`;
            request.input('Search', mssql_1.default.NVarChar, `%${search}%`);
        }
        query += ` ORDER BY clnt.NomAux ASC`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('❌ Error al obtener clientes de Softland:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
});
// OBTENER VENDEDORES / GESTORES COMERCIALES
router.get('/vendedores', auth_1.authMiddleware, async (req, res) => {
    try {
        const db = await (0, database_1.getDatabase)();
        const query = `
            SELECT VenCod, RTRIM(VenDes) as VenDes, RTRIM(EMail) as EMail 
            FROM STUEDEMANNSA.softland.cwtvend 
            WHERE VenDes IS NOT NULL AND VenDes <> ''
            ORDER BY VenDes ASC
        `;
        const result = await db.request().query(query);
        res.json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('❌ Error al obtener vendedores de Softland:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener vendedores',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=softland.js.map