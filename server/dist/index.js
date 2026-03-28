"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// ⚠️  Load env FIRST — before any other imports use process.env
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = __importDefault(require("./config/db"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
// ─── Route Imports ─────────────────────────────────────────────────────────────
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const challengeRoutes_1 = __importDefault(require("./routes/challengeRoutes"));
const predictionRoutes_1 = __importDefault(require("./routes/predictionRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// ─── Bootstrap ─────────────────────────────────────────────────────────────────
(0, db_1.default)();
const app = (0, express_1.default)();
// ─── Security & Parsing Middleware ────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', rateLimiter_1.generalLimiter);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: '🏏 CricClash API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/matches', matchRoutes_1.default);
app.use('/api/challenges', challengeRoutes_1.default);
app.use('/api/predictions', predictionRoutes_1.default);
app.use('/api/leaderboard', leaderboardRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found. Available routes: /api/health | /api/matches | /api/challenges | /api/predictions | /api/leaderboard | /api/users | /api/admin`,
    });
});
// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('');
        console.log('🏏 ================================================');
        console.log(`🚀  CricClash Server started!`);
        console.log(`📡  URL:  http://localhost:${PORT}`);
        console.log(`🌿  Env:  ${process.env.NODE_ENV || 'development'}`);
        console.log('🏏 ================================================');
        console.log('');
        console.log('📋  Available API routes:');
        console.log(`    GET  /api/health`);
        console.log(`    ─────────────────────────────────────`);
        console.log(`    GET  POST  /api/matches`);
        console.log(`    GET  POST  /api/challenges`);
        console.log(`    GET  POST  /api/predictions`);
        console.log(`    GET        /api/leaderboard`);
        console.log(`    GET  POST  /api/users`);
        console.log(`    GET  POST  /api/admin`);
        console.log('');
    });
}
exports.default = app;
