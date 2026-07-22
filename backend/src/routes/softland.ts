import express from 'express';
import { getDatabase } from '../database/database';
import { authMiddleware } from '../middleware/auth';
import sql from 'mssql';
import type { Request, Response } from 'express';

const router = express.Router();

// OBTENER CLIENTES (con búsqueda y comercial asignado)
router.get('/clientes', authMiddleware, async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
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
            request.input('Search', sql.NVarChar, `%${search}%`);
        }

        query += ` ORDER BY clnt.NomAux ASC`;

        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('❌ Error al obtener clientes de Softland:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
});

// OBTENER VENDEDORES / GESTORES COMERCIALES
router.get('/vendedores', authMiddleware, async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
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
    } catch (error: any) {
        console.error('❌ Error al obtener vendedores de Softland:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener vendedores',
            error: error.message
        });
    }
});

export default router;
