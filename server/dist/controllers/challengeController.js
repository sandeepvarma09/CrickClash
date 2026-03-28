"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChallengeLeaderboard = exports.getChallengeResults = exports.getChallengePredictions = exports.getChallengeById = exports.createChallenge = void 0;
const Challenge_1 = __importDefault(require("../models/Challenge"));
const Match_1 = __importDefault(require("../models/Match"));
const User_1 = __importDefault(require("../models/User"));
const Prediction_1 = __importDefault(require("../models/Prediction"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
const response_2 = require("../utils/response");
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';
// ─── Helpers ───────────────────────────────────────────────────────────────────
/** Ensure a User doc exists for a given username, create if not */
async function ensureUser(username) {
    username = username.trim().toLowerCase();
    let user = await User_1.default.findOne({ username });
    if (!user) {
        user = await User_1.default.create({ username, stats: {}, badges: [] });
    }
    return user;
}
/** Generate a unique challengeId (retry on collision) */
async function uniqueChallengeId() {
    for (let i = 0; i < 10; i++) {
        const id = (0, response_2.generateShortId)(6);
        const exists = await Challenge_1.default.exists({ challengeId: id });
        if (!exists)
            return id;
    }
    return (0, response_2.generateShortId)(10); // fallback: longer ID
}
// ─── POST /api/challenges ──────────────────────────────────────────────────────
exports.createChallenge = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { matchId, username, stake, predictions } = req.body;
    if (!matchId)
        throw new errorHandler_1.AppError('matchId is required', 400);
    if (!username)
        throw new errorHandler_1.AppError('username is required', 400);
    // Fetch match first (need it for questions/defaults)
    const match = await Match_1.default.findById(matchId);
    if (!match)
        throw new errorHandler_1.AppError('Match not found', 404);
    if (match.status === 'completed')
        throw new errorHandler_1.AppError('Cannot create a challenge for a completed match', 400);
    // Make answers dynamic if they pass questionAnswers array inside predictions
    const questionAnswers = Array.isArray(predictions?.questionAnswers) ? predictions.questionAnswers :
        (predictions ? Object.values(predictions).map(String) : []);
    const answers = {
        questionAnswers
    };
    // Ensure user
    const user = await ensureUser(username);
    // Generate unique short ID and shareUrl
    const challengeId = await uniqueChallengeId();
    const shareUrl = `${CLIENT_URL}/challenge/${challengeId}`;
    // Create the challenge
    const challenge = await Challenge_1.default.create({
        challengeId,
        matchId: match._id,
        creatorId: user._id,
        stake: stake?.trim() || 'Bragging rights 😤',
        shareUrl,
        expiresAt: match.date,
        participants: [],
    });
    // Create the creator's prediction
    await Prediction_1.default.create({
        challengeId: challenge._id,
        userId: user._id,
        answers,
    });
    (0, response_1.sendSuccess)(res, { challenge, shareUrl, challengeId }, 'Challenge created successfully!', 201);
});
// ─── GET /api/challenges/:id ───────────────────────────────────────────────────
exports.getChallengeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const challenge = await Challenge_1.default.findOne({ challengeId: id })
        // Populate questions so the join-form can render them dynamically
        .populate('matchId', 'teams date venue format status seriesName questions')
        .populate('creatorId', 'username avatar')
        .lean();
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    // Fetch creator's prediction
    const creatorPrediction = await Prediction_1.default.findOne({
        challengeId: challenge._id,
        userId: challenge.creatorId,
    }).lean();
    (0, response_1.sendSuccess)(res, { challenge, creatorPrediction }, 'Challenge fetched successfully');
});
// ─── GET /api/challenges/:id/predictions ──────────────────────────────────────
exports.getChallengePredictions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const challenge = await Challenge_1.default.findOne({ challengeId: id }).lean();
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    const predictions = await Prediction_1.default.find({ challengeId: challenge._id })
        .populate('userId', 'username avatar')
        .sort({ submittedAt: 1 })
        .lean();
    (0, response_1.sendSuccess)(res, predictions, `${predictions.length} prediction(s) found`);
});
// ─── GET /api/challenges/:id/results ──────────────────────────────────────────
exports.getChallengeResults = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const challenge = await Challenge_1.default.findOne({ challengeId: id })
        .populate('matchId')
        .lean();
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    const match = challenge.matchId;
    if (match.status !== 'completed') {
        throw new errorHandler_1.AppError('Match has not ended yet — results not available', 400);
    }
    const predictions = await Prediction_1.default.find({ challengeId: challenge._id })
        .populate('userId', 'username avatar')
        .sort({ score: -1, submittedAt: 1 })
        .lean();
    (0, response_1.sendSuccess)(res, { challenge, predictions }, 'Results fetched');
});
// ─── GET /api/challenges/:id/leaderboard ──────────────────────────────────────
exports.getChallengeLeaderboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const challenge = await Challenge_1.default.findOne({ challengeId: id }).lean();
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    const predictions = await Prediction_1.default.find({ challengeId: challenge._id })
        .populate('userId', 'username avatar')
        .sort({ score: -1, submittedAt: 1 })
        .lean();
    const rankings = predictions.map((p, index) => ({
        rank: index + 1,
        user: p.userId,
        score: p.score,
        answers: p.answers,
        results: p.results,
        isWinner: index === 0,
        isPunished: index === predictions.length - 1 && predictions.length > 1,
        submittedAt: p.submittedAt,
    }));
    (0, response_1.sendSuccess)(res, { challenge, rankings, stake: challenge.stake }, 'Leaderboard fetched');
});
