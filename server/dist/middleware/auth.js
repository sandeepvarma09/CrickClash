"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/** Protect user routes — requires valid JWT */
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.userId = decoded.id;
        req.isAdmin = decoded.isAdmin || false;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Not authorised. Invalid or expired token.' });
    }
};
exports.protect = protect;
/** Protect admin-only routes */
const adminOnly = (req, res, next) => {
    if (!req.isAdmin) {
        res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
