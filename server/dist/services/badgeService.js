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
exports.awardBadges = awardBadges;
exports.evaluateBadgesForChallenge = evaluateBadgesForChallenge;
const User_1 = __importDefault(require("../models/User"));
/**
 * TASK-16: Evaluate and award all eligible badges to a user.
 * Returns list of newly awarded badges.
 */
async function awardBadges(user, predictions, challenges) {
    const awarded = [];
    const evaluated = predictions.filter(p => p.isEvaluated);
    // ── Perfect Prediction: all answers correct in any single attempt ────────────────
    const hasPerfect = evaluated.some(p => p.results?.totalCorrect === (p.results?.questionResults?.length ?? 5) && p.results?.totalCorrect > 0);
    if (hasPerfect)
        awarded.push('perfect_prediction');
    // ── Win Streaks ─────────────────────────────────────────────────────────────
    const streak = user.stats.bestStreak;
    if (streak >= 3)
        awarded.push('win_streak_3');
    if (streak >= 5)
        awarded.push('win_streak_5');
    if (streak >= 10)
        awarded.push('win_streak_10');
    // ── Lone Wolf: correct match winner when majority chose opposite ─────────────
    // (Simplified: badge triggered externally via admin; just check if already present)
    // Save new badges
    for (const badge of awarded) {
        await user.addBadge(badge);
    }
    return awarded;
}
/**
 * Award badges after a match result is processed.
 * Called by resultService once predictions are evaluated.
 */
async function evaluateBadgesForChallenge(challengeId) {
    const { default: Prediction } = await Promise.resolve().then(() => __importStar(require('../models/Prediction')));
    const { default: Challenge } = await Promise.resolve().then(() => __importStar(require('../models/Challenge')));
    const { Types } = await Promise.resolve().then(() => __importStar(require('mongoose')));
    const challenge = await Challenge.findById(challengeId);
    if (!challenge)
        return;
    const predictions = await Prediction.find({ challengeId: challenge._id }).lean();
    const scores = predictions.map(p => p.score);
    const maxScore = Math.max(...scores);
    for (const pred of predictions) {
        const user = await User_1.default.findById(pred.userId);
        if (!user)
            continue;
        const allPreds = await Prediction.find({ userId: user._id }).lean();
        const allChallenges = await Challenge.find({
            $or: [{ creatorId: user._id }, { 'participants.userId': user._id }],
        }).lean();
        await awardBadges(user, allPreds, allChallenges);
        // Lone Wolf: only one who got max score and > 1 participant
        if (pred.score === maxScore && scores.filter(s => s === maxScore).length === 1 && predictions.length > 1) {
            await user.addBadge('lone_wolf');
        }
        // Update best streak in stats
        const wins = user.stats.wins;
        if (wins > user.stats.bestStreak) {
            await User_1.default.findByIdAndUpdate(user._id, { 'stats.bestStreak': wins });
        }
        // Update accuracy
        if (allPreds.length > 0) {
            const totalCorrect = allPreds.reduce((sum, p) => sum + (p.results?.totalCorrect ?? 0), 0);
            const totalPossible = allPreds.reduce((sum, p) => sum + (p.results?.questionResults?.length ?? 5), 0);
            await user.updateAccuracy(totalCorrect, totalPossible);
        }
    }
}
