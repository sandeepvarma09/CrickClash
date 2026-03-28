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
exports.evaluateChallengesForMatch = evaluateChallengesForMatch;
exports.getGlobalLeaderboard = getGlobalLeaderboard;
const Prediction_1 = __importDefault(require("../models/Prediction"));
const Leaderboard_1 = __importDefault(require("../models/Leaderboard"));
const Challenge_1 = __importDefault(require("../models/Challenge"));
const Match_1 = __importDefault(require("../models/Match"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
/**
 * TASK-13: Evaluate all predictions for every open challenge tied to a match,
 * then compute and upsert leaderboards.
 */
async function evaluateChallengesForMatch(matchId) {
    const match = await Match_1.default.findById(matchId);
    if (!match?.questions)
        throw new Error('Match has no questions to evaluate against');
    // Find all challenges for this match
    const challenges = await Challenge_1.default.find({ matchId: new mongoose_1.Types.ObjectId(matchId) });
    let predictionsEvaluated = 0;
    for (const challenge of challenges) {
        // Get all predictions for the challenge
        const predictions = await Prediction_1.default.find({ challengeId: challenge._id });
        // Evaluate each un-evaluated prediction
        for (const pred of predictions) {
            if (!pred.isEvaluated) {
                await pred.evaluate(match.questions);
                predictionsEvaluated++;
            }
        }
        // Re-fetch predictions with updated scores
        const evaluated = await Prediction_1.default.find({ challengeId: challenge._id }).lean();
        // Build leaderboard data using the static method
        const lbData = Leaderboard_1.default.buildFromPredictions(evaluated.map(p => ({
            userId: p.userId,
            score: p.score,
            submittedAt: p.submittedAt,
        })), challenge._id, new mongoose_1.Types.ObjectId(matchId), challenge.stake);
        // Upsert the leaderboard
        await Leaderboard_1.default.findOneAndUpdate({ challengeId: challenge._id }, lbData, { upsert: true, new: true, setDefaultsOnInsert: true });
        // Mark challenge as completed
        await challenge.complete();
        // ── TASK-16: Award badges to all participants ────────────────────────────
        try {
            const { evaluateBadgesForChallenge } = await Promise.resolve().then(() => __importStar(require('./badgeService')));
            await evaluateBadgesForChallenge(String(challenge._id));
        }
        catch (e) {
            console.warn('Badge evaluation failed:', e);
        }
        // Update participant user stats
        for (const pred of evaluated) {
            await User_1.default.findByIdAndUpdate(pred.userId, {
                $inc: {
                    'stats.totalChallenges': 1,
                    'stats.wins': pred.score === Math.max(...evaluated.map(p => p.score)) ? 1 : 0,
                    'stats.losses': pred.score === Math.min(...evaluated.map(p => p.score)) ? 1 : 0,
                },
            });
        }
    }
    return { challengesProcessed: challenges.length, predictionsEvaluated };
}
/**
 * Get global leaderboard — top users by wins across all challenges
 */
async function getGlobalLeaderboard(limit = 20) {
    return User_1.default.find({ 'stats.totalChallenges': { $gt: 0 }, isAdmin: { $ne: true } })
        .sort({ 'stats.wins': -1, 'stats.accuracy': -1 })
        .limit(limit)
        .select('username avatar stats badges')
        .lean();
}
