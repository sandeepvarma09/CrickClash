"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const Prediction_1 = __importDefault(require("../models/Prediction"));
const Challenge_1 = __importDefault(require("../models/Challenge"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const badgeService_1 = require("../services/badgeService");
const router = (0, express_1.Router)();
// ─── GET /api/users/:username ──────────────────────────────────────────────────
router.get('/:username', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const username = String(req.params.username).trim().toLowerCase();
    const user = await User_1.default.findOne({ username }).lean();
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    // Fetch their 5 most recent challenge predictions
    const recentPredictions = await Prediction_1.default.find({ userId: user._id })
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate({
        path: 'challengeId',
        select: 'challengeId stake status matchId',
        populate: { path: 'matchId', select: 'teams date format status questions' },
    })
        .lean();
    (0, response_1.sendSuccess)(res, { user, recentPredictions }, 'User profile fetched');
}));
// ─── POST /api/users — create / ensure user ────────────────────────────────────
// ─── POST /api/users/register ──────────────────────────────────────────────────
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        throw new errorHandler_1.AppError('Username, email, and password are required', 400);
    const name = username.trim().toLowerCase();
    const mail = email.trim().toLowerCase();
    // TASK-AUTH: Validate email format and password length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail))
        throw new errorHandler_1.AppError('Invalid email format', 400);
    if (password.length < 6)
        throw new errorHandler_1.AppError('Password must be at least 6 characters', 400);
    const existing = await User_1.default.findOne({ $or: [{ username: name }, { email: mail }] });
    if (existing)
        throw new errorHandler_1.AppError('Username or email already exists', 400);
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({
        username: name,
        email: mail,
        password: hashedPassword,
        isAdmin: mail === 'admin@example.com' || name === 'admin',
    });
    (0, response_1.sendSuccess)(res, { username: user.username, email: user.email, isAdmin: user.isAdmin }, 'Registration successful', 201);
}));
// ─── POST /api/users/login ─────────────────────────────────────────────────────
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new errorHandler_1.AppError('Email and password are required', 400);
    const mail = email.trim().toLowerCase();
    const user = await User_1.default.findOne({ email: mail }).select('+password').lean();
    if (!user || !user.password)
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    (0, response_1.sendSuccess)(res, { username: user.username, email: user.email, isAdmin: user.isAdmin }, 'Login successful');
}));
// ─── Legacy POST /api/users (used by old app functionality) ──────────────────────
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { username } = req.body;
    if (!username)
        throw new errorHandler_1.AppError('username is required', 400);
    const name = username.trim().toLowerCase();
    let user = await User_1.default.findOne({ username: name });
    if (!user) {
        user = await User_1.default.create({ username: name, isAdmin: name === 'admin' });
    }
    (0, response_1.sendSuccess)(res, user, user.isNew ? 'User created' : 'User found');
}));
// ─── POST /api/users/:username/badges/evaluate ────────────────────────────────
// Manually trigger badge evaluation for a user (admin utility)
router.post('/:username/badges/evaluate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const username = String(req.params.username).trim().toLowerCase();
    const user = await User_1.default.findOne({ username });
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    const predictions = await Prediction_1.default.find({ userId: user._id }).lean();
    const challenges = await Challenge_1.default.find({ creatorId: user._id }).lean();
    const awarded = await (0, badgeService_1.awardBadges)(user, predictions, challenges);
    (0, response_1.sendSuccess)(res, { user: await User_1.default.findById(user._id).lean(), awarded }, 'Badges evaluated');
}));
// ─── GET /api/users/:username/notifications/latest ────────────────────────────
// Fetches the most recent completed challenge result for pop-up display
router.get('/:username/notifications/latest', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const username = String(req.params.username).trim().toLowerCase();
    const user = await User_1.default.findOne({ username }).lean();
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    // Find the most recent completed challenge this user participated in
    const latestResult = await Prediction_1.default.findOne({ userId: user._id, isEvaluated: true })
        .sort({ submittedAt: -1 })
        .populate({
        path: 'challengeId',
        select: 'challengeId stake status matchId',
        populate: { path: 'matchId', select: 'teams' },
    })
        .lean();
    if (!latestResult) {
        (0, response_1.sendSuccess)(res, null, 'No recent results');
        return;
    }
    // Also find the winner and loser scores
    const challengeId = latestResult.challengeId._id;
    const allParticipants = await Prediction_1.default.find({ challengeId }).populate('userId', 'username').lean();
    const scores = allParticipants.map(p => p.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const winners = allParticipants.filter(p => p.score === maxScore).map(p => p.userId.username);
    const losers = allParticipants.filter(p => p.score === minScore).map(p => p.userId.username);
    (0, response_1.sendSuccess)(res, {
        challenge: latestResult.challengeId,
        userScore: latestResult.score,
        winners,
        losers,
        stake: latestResult.challengeId.stake,
        match: latestResult.challengeId.matchId,
    }, 'Latest notification fetched');
    return;
}));
// ─── GET /api/users/:username/predictions ─────────────────────────────────────
// Fetches all challenges/predictions for the "My Challenges" page
router.get('/:username/predictions', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const username = String(req.params.username).trim().toLowerCase();
    const user = await User_1.default.findOne({ username }).lean();
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    const predictions = await Prediction_1.default.find({ userId: user._id })
        .sort({ submittedAt: -1 })
        .populate({
        path: 'challengeId',
        select: 'challengeId stake status matchId',
        populate: { path: 'matchId', select: 'teams date format status questions' },
    })
        .lean();
    (0, response_1.sendSuccess)(res, predictions, 'User predictions fetched');
    return;
}));
exports.default = router;
