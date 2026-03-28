"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMatch = exports.updateMatchResult = exports.createMatch = exports.searchPlayers = exports.seedMatches = exports.syncMatches = exports.getMatchById = exports.getUpcomingMatches = exports.getMatches = void 0;
const Match_1 = __importDefault(require("../models/Match"));
const matchSyncService_1 = __importDefault(require("../services/matchSyncService"));
const cricketApiService_1 = __importDefault(require("../services/cricketApiService"));
const resultService_1 = require("../services/resultService");
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function qs(val, fallback = '') {
    if (val === null || val === undefined)
        return fallback;
    if (Array.isArray(val))
        return val.length > 0 ? String(val[0]) : fallback;
    if (typeof val === 'object')
        return fallback;
    return String(val);
}
// ─── GET /api/matches ─────────────────────────────────────────────────────────
exports.getMatches = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const status = qs(req.query.status, 'upcoming,live');
    const format = qs(req.query.format);
    const page = Math.max(1, parseInt(qs(req.query.page, '1')));
    const limit = Math.min(parseInt(qs(req.query.limit, '20')), 50);
    const skip = (page - 1) * limit;
    const statusFilter = status.split(',').map((s) => s.trim());
    const query = { status: { $in: statusFilter } };
    if (format)
        query.format = format.toUpperCase();
    const count = await Match_1.default.countDocuments(query);
    // Auto-sync disabled per user request: only show admin-created matches
    const [matches, total] = await Promise.all([
        Match_1.default.find(query).sort({ date: 1 }).skip(skip).limit(limit).lean(),
        Match_1.default.countDocuments(query),
    ]);
    (0, response_1.sendPaginated)(res, matches, total, page, limit, 'Matches fetched successfully');
});
// ─── GET /api/matches/upcoming ────────────────────────────────────────────────
exports.getUpcomingMatches = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const matches = await matchSyncService_1.default.getUpcomingMatches(20);
    (0, response_1.sendSuccess)(res, matches, `${matches.length} upcoming matches found`);
});
// ─── GET /api/matches/:id ─────────────────────────────────────────────────────
exports.getMatchById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = String(req.params.id);
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const match = await Match_1.default.findOne({
        $or: [...(isObjectId ? [{ _id: id }] : []), { externalId: id }],
    }).lean();
    if (!match)
        throw new errorHandler_1.AppError('Match not found', 404);
    (0, response_1.sendSuccess)(res, match, 'Match fetched successfully');
});
// ─── GET /api/matches/sync ────────────────────────────────────────────────────
exports.syncMatches = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const result = await matchSyncService_1.default.syncCurrentMatches();
    (0, response_1.sendSuccess)(res, result, `Sync complete: ${result.created} created, ${result.updated} updated`);
});
// ─── GET /api/matches/seed (dev only) ────────────────────────────────────────
exports.seedMatches = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    if (process.env.NODE_ENV === 'production')
        throw new errorHandler_1.AppError('Not allowed in production', 403);
    const count = await matchSyncService_1.default.seedMockMatches();
    (0, response_1.sendSuccess)(res, { seeded: count }, `${count} mock matches seeded`);
});
// ─── GET /api/matches/players/search?name=Kohli ───────────────────────────────
exports.searchPlayers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const name = qs(req.query.name).trim();
    if (name.length < 2)
        throw new errorHandler_1.AppError('Search query must be at least 2 characters', 400);
    const players = await cricketApiService_1.default.searchPlayers(name);
    (0, response_1.sendSuccess)(res, players, `${players.length} players found`);
});
// ─── POST /api/matches (Admin) ────────────────────────────────────────────────
exports.createMatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { team1Name, team1Short, team2Name, team2Short, date, venue, city, format, seriesName } = req.body;
    if (!team1Name || !team2Name || !date || !venue) {
        throw new errorHandler_1.AppError('team1Name, team2Name, date, and venue are required', 400);
    }
    const match = await Match_1.default.create({
        teams: [
            { name: team1Name, shortName: team1Short || team1Name.slice(0, 3).toUpperCase(), flagUrl: '' },
            { name: team2Name, shortName: team2Short || team2Name.slice(0, 3).toUpperCase(), flagUrl: '' },
        ],
        date: new Date(date),
        venue,
        city: city || venue,
        format: format || 'T20',
        status: 'upcoming',
        seriesName: seriesName || '',
        isAdded: true,
    });
    (0, response_1.sendSuccess)(res, match, 'Match created successfully', 201);
});
// ─── PUT /api/matches/:id/result (Admin) ─────────────────────────────────────
exports.updateMatchResult = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { tossWinner, matchWinner, topRunScorer, totalRunsByWinner, playerOfTheMatch, margin } = req.body;
    if (!tossWinner || !matchWinner || !topRunScorer || totalRunsByWinner === undefined || !playerOfTheMatch) {
        throw new errorHandler_1.AppError('All 5 result fields are required', 400);
    }
    const match = await Match_1.default.findByIdAndUpdate(id, {
        result: { tossWinner, matchWinner, topRunScorer, totalRunsByWinner: Number(totalRunsByWinner), playerOfTheMatch, margin: margin || '' },
        status: 'completed',
    }, { new: true, runValidators: true });
    if (!match)
        throw new errorHandler_1.AppError('Match not found', 404);
    // ── TASK-13: Trigger auto-evaluation of all predictions for this match ──────
    try {
        const evalResult = await (0, resultService_1.evaluateChallengesForMatch)(String(match._id));
        (0, response_1.sendSuccess)(res, { match, evaluation: evalResult }, `Match result saved. ${evalResult.predictionsEvaluated} predictions evaluated across ${evalResult.challengesProcessed} challenges.`);
    }
    catch (evalErr) {
        console.error('Result evaluation error:', evalErr);
        (0, response_1.sendSuccess)(res, match, 'Match result updated. Prediction evaluation encountered an error.');
    }
});
// ─── DELETE /api/matches/:id (Admin) ─────────────────────────────────────────
exports.deleteMatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const match = await Match_1.default.findByIdAndDelete(req.params.id);
    if (!match)
        throw new errorHandler_1.AppError('Match not found', 404);
    (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Match deleted');
});
