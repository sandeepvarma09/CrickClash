"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPrediction = exports.submitPrediction = void 0;
const Challenge_1 = __importDefault(require("../models/Challenge"));
const User_1 = __importDefault(require("../models/User"));
const Prediction_1 = __importDefault(require("../models/Prediction"));
const errorHandler_1 = require("../middleware/errorHandler");
const response_1 = require("../utils/response");
// ─── Helpers ───────────────────────────────────────────────────────────────────
async function ensureUser(username) {
    const name = username.trim().toLowerCase();
    let user = await User_1.default.findOne({ username: name });
    if (!user)
        user = await User_1.default.create({ username: name, stats: {}, badges: [] });
    return user;
}
// ─── POST /api/predictions ─────────────────────────────────────────────────────
/**
 * Body: { challengeId (short), username, predictions: { tossWinner, matchWinner,
 *          topRunScorer, totalRunsByWinner, playerOfTheMatch } }
 */
exports.submitPrediction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { challengeId: shortId, username, predictions } = req.body;
    if (!shortId)
        throw new errorHandler_1.AppError('challengeId is required', 400);
    if (!username)
        throw new errorHandler_1.AppError('username is required', 400);
    if (!predictions)
        throw new errorHandler_1.AppError('predictions object is required', 400);
    const questionAnswers = Array.isArray(predictions.questionAnswers) ? predictions.questionAnswers :
        (predictions ? Object.values(predictions).map(String) : []);
    if (questionAnswers.length === 0) {
        throw new errorHandler_1.AppError('Predictions are required', 400);
    }
    // Find challenge
    const challenge = await Challenge_1.default.findOne({ challengeId: shortId }).populate('matchId');
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    if (challenge.status !== 'open')
        throw new errorHandler_1.AppError('This challenge is no longer accepting predictions', 400);
    // Ensure user + check not creator
    const user = await ensureUser(username);
    // Check duplicate
    const existing = await Prediction_1.default.findOne({ challengeId: challenge._id, userId: user._id });
    if (existing)
        throw new errorHandler_1.AppError('You have already submitted predictions for this challenge', 409);
    // Add participant if not already listed
    if (!challenge.hasParticipant(user._id)) {
        await challenge.addParticipant(user._id);
    }
    // Save prediction
    const prediction = await Prediction_1.default.create({
        challengeId: challenge._id,
        userId: user._id,
        answers: {
            questionAnswers,
        },
    });
    (0, response_1.sendSuccess)(res, { prediction, challengeId: shortId }, 'Predictions submitted successfully!', 201);
});
// ─── GET /api/predictions/:challengeId/:username ──────────────────────────────
exports.getUserPrediction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { challengeId: shortId, userId: username } = req.params;
    const challenge = await Challenge_1.default.findOne({ challengeId: shortId });
    if (!challenge)
        throw new errorHandler_1.AppError('Challenge not found', 404);
    const user = await User_1.default.findOne({ username: String(username).trim().toLowerCase() });
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    const prediction = await Prediction_1.default.findOne({ challengeId: challenge._id, userId: user._id })
        .populate('userId', 'username avatar')
        .lean();
    if (!prediction)
        throw new errorHandler_1.AppError('No prediction found for this user in this challenge', 404);
    (0, response_1.sendSuccess)(res, prediction, 'Prediction fetched');
});
