"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.roleMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'No autorizado - Token no proporcionado'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto');
        req.user = decoded;
        // Verificar si el usuario existe y está activo
        try {
            const user = await User_1.UserModel.findById(decoded.id);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado - Usuario no encontrado'
                });
                return;
            }
            if (!user.Activo) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado - Usuario inactivo'
                });
                return;
            }
        }
        catch (dbError) {
            console.warn('⚠️ No se pudo verificar usuario en BD:', dbError);
        }
        next();
    }
    catch (error) {
        console.error('❌ Error en authMiddleware:', error);
        res.status(401).json({
            success: false,
            message: 'No autorizado - Token inválido o expirado'
        });
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado - Usuario no autenticado'
                });
                return;
            }
            if (!user.role || !allowedRoles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - No tienes permisos suficientes'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('❌ Error en roleMiddleware:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permisos'
            });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto');
                req.user = decoded;
            }
            catch (error) {
                console.warn('⚠️ Token inválido en optionalAuth');
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map