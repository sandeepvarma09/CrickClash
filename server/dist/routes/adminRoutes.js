"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Match_1 = __importDefault(require("../models/Match"));
const Challenge_1 = __importDefault(require("../models/Challenge"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'admin123';
const JWT_SECRET = process.env.JWT_SECRET ?? 'cricclash_secret_2026';
// ── Admin auth middleware ───────────────────────────────────────────────────────
function adminGuard(req, _res, next) {
    const token = req.headers['x-admin-token'];
    if (!token)
        throw new errorHandler_1.AppError('Admin token required', 401);
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch {
        throw new errorHandler_1.AppError('Invalid or expired admin token', 401);
    }
}
// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        throw new errorHandler_1.AppError('username and password required', 400);
    const usernameOk = username.trim() === ADMIN_USER;
    const passwordOk = password === ADMIN_PASS;
    if (!usernameOk || !passwordOk)
        throw new errorHandler_1.AppError('Invalid credentials', 401);
    const token = jsonwebtoken_1.default.sign({ role: 'admin', sub: username }, JWT_SECRET, { expiresIn: '8h' });
    (0, response_1.sendSuccess)(res, { token }, 'Admin login successful');
}));
// ─── GET /api/admin/matches ───────────────────────────────────────────────────
router.get('/matches', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(50, parseInt(String(req.query.limit ?? '50')));
    const skip = (page - 1) * limit;
    const [matches, total] = await Promise.all([
        Match_1.default.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
        Match_1.default.countDocuments(),
    ]);
    (0, response_1.sendPaginated)(res, matches, total, page, limit, 'Admin matches fetched');
}));
// ─── POST /api/admin/matches — create match manually ─────────────────────────
router.post('/matches', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { team1Name, team1Short, team2Name, team2Short, date, venue, city, format, seriesName, questions } = req.body;
    if (!team1Name || !team2Name || !date || !venue) {
        throw new errorHandler_1.AppError('team1Name, team2Name, date and venue are required', 400);
    }
    // Validate & sanitize questions (max 4)
    const sanitizedQuestions = Array.isArray(questions)
        ? questions.slice(0, 4).filter(q => q.question?.trim()).map(q => ({
            question: q.question.trim(),
            options: (q.options ?? []).filter((o) => o?.trim()).map((o) => o.trim()),
            correctAnswer: '',
        }))
        : [];
    const match = await Match_1.default.create({
        teams: [
            { name: team1Name.trim(), shortName: (team1Short || team1Name.slice(0, 3)).toUpperCase().trim(), flagUrl: '' },
            { name: team2Name.trim(), shortName: (team2Short || team2Name.slice(0, 3)).toUpperCase().trim(), flagUrl: '' },
        ],
        date: new Date(date),
        venue: venue.trim(),
        city: (city || venue).trim(),
        format: (format || 'T20').toUpperCase(),
        status: 'upcoming',
        seriesName: (seriesName || '').trim(),
        questions: sanitizedQuestions,
        isAdded: true,
    });
    (0, response_1.sendSuccess)(res, match, 'Match created successfully', 201);
}));
// ─── GET /api/admin/seed — seed mock matches ──────────────────────────────────
router.get('/seed', adminGuard, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const { default: matchSyncService } = await Promise.resolve().then(() => __importStar(require('../services/matchSyncService')));
    const count = await matchSyncService.seedMockMatches();
    (0, response_1.sendSuccess)(res, { seeded: count }, `${count} mock matches seeded`);
}));
// ─── PUT /api/admin/matches/:id/result ───────────────────────────────────────
router.put('/matches/:id/result', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tossWinner, matchWinner, topRunScorer, totalRunsByWinner, playerOfTheMatch, questionAnswers } = req.body;
    const matchDoc = await Match_1.default.findById(req.params.id);
    if (!matchDoc)
        throw new errorHandler_1.AppError('Match not found', 404);
    if (Array.isArray(questionAnswers)) {
        matchDoc.questions.forEach((q, i) => {
            q.correctAnswer = questionAnswers[i] || '';
        });
    }
    matchDoc.status = 'completed';
    if (tossWinner) {
        matchDoc.result = { tossWinner, matchWinner, topRunScorer, totalRunsByWinner: Number(totalRunsByWinner || 0), playerOfTheMatch };
    }
    const match = await matchDoc.save();
    try {
        const { evaluateChallengesForMatch } = await Promise.resolve().then(() => __importStar(require('../services/resultService')));
        const evalResult = await evaluateChallengesForMatch(String(match._id));
        (0, response_1.sendSuccess)(res, { match, evaluation: evalResult }, `Result saved. ${evalResult.predictionsEvaluated} predictions evaluated.`);
    }
    catch {
        (0, response_1.sendSuccess)(res, match, 'Match result saved.');
    }
}));
// ─── DELETE /api/admin/matches/:id ───────────────────────────────────────────
router.delete('/matches/:id', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const match = await Match_1.default.findByIdAndDelete(req.params.id);
    if (!match)
        throw new errorHandler_1.AppError('Match not found', 404);
    (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Match deleted');
}));
// ─── GET /api/admin/challenges ────────────────────────────────────────────────
router.get('/challenges', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(50, parseInt(String(req.query.limit ?? '50')));
    const skip = (page - 1) * limit;
    const [challenges, total] = await Promise.all([
        Challenge_1.default.find()
            .populate('matchId', 'teams date status format')
            .populate('creatorId', 'username')
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit).lean(),
        Challenge_1.default.countDocuments(),
    ]);
    (0, response_1.sendPaginated)(res, challenges, total, page, limit, 'Admin challenges fetched');
}));
// ─── DELETE /api/admin/challenges/:id ────────────────────────────────────────
router.delete('/challenges/:id', adminGuard, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ch = await Challenge_1.default.findByIdAndDelete(req.params.id);
    if (!ch)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Challenge deleted');
}));
exports.default = router;
