import express from 'express';
import { body, validationResult } from 'express-validator';
import { FichaModel } from '../models/Ficha';
import { authMiddleware } from '../middleware/auth';
import type { Request, Response } from 'express';
import { getDatabase } from '../database/database';
import sql from 'mssql';
import { sendLiderNotificationEmail, getBaseFrontendUrl } from './email';

const router = express.Router();

// Helper para obtener email del líder asignado desde Profesionales o Usuarios
async function findLeaderEmail(lider: string, liderId?: string): Promise<{ email: string; nombre: string } | null> {
    if (!lider && !liderId) return null;

    if (lider && lider.includes('@')) {
        return { email: lider.trim(), nombre: lider.trim() };
    }

    try {
        const db = await getDatabase();

        // 1. Buscar en Profesionales por Id
        if (liderId && !isNaN(Number(liderId))) {
            const resProf = await db.request()
                .input('Id', sql.Int, Number(liderId))
                .query("SELECT Nombre, Email FROM Profesionales WHERE Id = @Id AND Email IS NOT NULL AND Email <> ''");
            if (resProf.recordset.length > 0 && resProf.recordset[0].Email) {
                return { email: resProf.recordset[0].Email.trim(), nombre: resProf.recordset[0].Nombre };
            }
        }

        // 2. Buscar en Profesionales por Nombre
        if (lider) {
            const resProfName = await db.request()
                .input('Nombre', sql.NVarChar, lider.trim())
                .query("SELECT Nombre, Email FROM Profesionales WHERE LOWER(LTRIM(RTRIM(Nombre))) = LOWER(LTRIM(RTRIM(@Nombre))) AND Email IS NOT NULL AND Email <> ''");
            if (resProfName.recordset.length > 0 && resProfName.recordset[0].Email) {
                return { email: resProfName.recordset[0].Email.trim(), nombre: resProfName.recordset[0].Nombre };
            }
        }

        // 3. Buscar en Usuarios por Id
        if (liderId && !isNaN(Number(liderId))) {
            const resUser = await db.request()
                .input('Id', sql.Int, Number(liderId))
                .query("SELECT Nombre, Email FROM Usuarios WHERE Id = @Id AND Email IS NOT NULL AND Email <> ''");
            if (resUser.recordset.length > 0 && resUser.recordset[0].Email) {
                return { email: resUser.recordset[0].Email.trim(), nombre: resUser.recordset[0].Nombre };
            }
        }

        // 4. Buscar en Usuarios por Nombre
        if (lider) {
            const resUserName = await db.request()
                .input('Nombre', sql.NVarChar, lider.trim())
                .query("SELECT Nombre, Email FROM Usuarios WHERE LOWER(LTRIM(RTRIM(Nombre))) = LOWER(LTRIM(RTRIM(@Nombre))) AND Email IS NOT NULL AND Email <> ''");
            if (resUserName.recordset.length > 0 && resUserName.recordset[0].Email) {
                return { email: resUserName.recordset[0].Email.trim(), nombre: resUserName.recordset[0].Nombre };
            }
        }
    } catch (err) {
        console.error('Error buscando email del líder:', err);
    }

    return null;
}

// ============================================
// OBTENER TODAS LAS FICHAS
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const fichas = await FichaModel.findAll();
        res.json({
            success: true,
            data: fichas
        });
    } catch (error) {
        console.error('❌ Error al obtener fichas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener fichas'
        });
    }
});

// ============================================
// OBTENER FICHA PÚBLICA POR ID (Sin autenticación)
// ============================================
router.get('/public/:id', async (req: Request, res: Response) => {
    try {
        console.log(`🔍 Buscando ficha pública con ID: ${req.params.id}`);
        const ficha = await FichaModel.findById(req.params.id);
        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha no encontrada'
            });
        }
        res.json({
            success: true,
            data: ficha
        });
    } catch (error) {
        console.error('❌ Error al obtener ficha pública:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ficha pública'
        });
    }
});

// ============================================
// ACTUALIZAR FICHA PÚBLICA (Sin autenticación)
// ============================================
router.put('/public/:id', async (req: Request, res: Response) => {
    try {
        console.log(`📝 Actualizando ficha pública ID: ${req.params.id}`);
        const ficha = await FichaModel.update(req.params.id, req.body);
        res.json({
            success: true,
            data: ficha,
            message: 'Ficha actualizada exitosamente'
        });
    } catch (error: any) {
        console.error('❌ Error al actualizar ficha pública:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar ficha pública'
        });
    }
});

// ============================================
// OBTENER FICHA POR ID
// ============================================
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const ficha = await FichaModel.findById(req.params.id);
        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha no encontrada'
            });
        }
        res.json({
            success: true,
            data: ficha
        });
    } catch (error) {
        console.error('❌ Error al obtener ficha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ficha'
        });
    }
});

// ============================================
// CREAR FICHA
// ============================================
router.post(
    '/',
    authMiddleware,
    [
        body('nombreProyecto').notEmpty().withMessage('El nombre del proyecto es requerido'),
        body('cliente').notEmpty().withMessage('El cliente es requerido'),
        body('lider').notEmpty().withMessage('El líder es requerido')
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const ficha = await FichaModel.create(req.body);

            // Notificar al líder asignado por correo
            const liderVal = req.body.lider || ficha.lider;
            const liderIdVal = req.body.liderId || ficha.liderId;
            if (liderVal) {
                findLeaderEmail(liderVal, liderIdVal).then(leaderInfo => {
                    if (leaderInfo && leaderInfo.email) {
                        const baseUrl = getBaseFrontendUrl(req);
                        sendLiderNotificationEmail({
                            to: leaderInfo.email,
                            liderNombre: leaderInfo.nombre,
                            nombreProyecto: ficha.nombreProyecto,
                            codigo: ficha.codigo,
                            cliente: ficha.cliente,
                            link: `${baseUrl}/formulario-ficha/${ficha.id}`
                        }).catch(e => console.error('Error enviando notificación al líder:', e));
                    }
                });
            }

            res.status(201).json({
                success: true,
                data: ficha,
                message: 'Ficha creada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al crear ficha:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear ficha'
            });
        }
    }
);

// ============================================
// ACTUALIZAR FICHA
// ============================================
router.put(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const fichaAntes = await FichaModel.findById(req.params.id);
            const ficha = await FichaModel.update(req.params.id, req.body);

            // Notificar al líder si hay un líder registrado/asignado
            const liderVal = req.body.lider || ficha.lider;
            const liderIdVal = req.body.liderId || ficha.liderId;
            const liderAnterior = fichaAntes?.lider;

            if (liderVal && (liderVal !== liderAnterior || req.body.lider || req.body.liderId)) {
                findLeaderEmail(liderVal, liderIdVal).then(leaderInfo => {
                    if (leaderInfo && leaderInfo.email) {
                        const baseUrl = getBaseFrontendUrl(req);
                        sendLiderNotificationEmail({
                            to: leaderInfo.email,
                            liderNombre: leaderInfo.nombre,
                            nombreProyecto: ficha.nombreProyecto,
                            codigo: ficha.codigo,
                            cliente: ficha.cliente,
                            link: `${baseUrl}/formulario-ficha/${ficha.id}`
                        }).catch(e => console.error('Error enviando notificación al líder:', e));
                    }
                });
            }

            res.json({
                success: true,
                data: ficha,
                message: 'Ficha actualizada exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al actualizar ficha:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar ficha'
            });
        }
    }
);

// ============================================
// ELIMINAR FICHA
// ============================================
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        await FichaModel.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ficha eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('❌ Error al eliminar ficha:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar ficha'
        });
    }
});

export default router;

