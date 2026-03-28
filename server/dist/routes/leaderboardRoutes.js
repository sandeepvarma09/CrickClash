"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resultService_1 = require("../services/resultService");
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// GET /api/leaderboard/global  — all-time top players
router.get('/global', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const users = await (0, resultService_1.getGlobalLeaderboard)(20);
    (0, response_1.sendSuccess)(res, users, 'Global leaderboard fetched');
}));
// GET /api/leaderboard/weekly  — top players in last 7 days (by recent challenge wins)
router.get('/weekly', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const users = await User_1.default.find({
        'stats.totalChallenges': { $gt: 0 },
        isAdmin: { $ne: true },
        updatedAt: { $gte: since },
    })
        .sort({ 'stats.wins': -1, 'stats.accuracy': -1 })
        .limit(20)
        .select('username avatar stats badges')
        .lean();
    (0, response_1.sendSuccess)(res, users, 'Weekly leaderboard fetched');
}));
exports.default = router;
