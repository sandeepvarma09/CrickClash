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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ─── Sub-schema: ranking entry ─────────────────────────────────────────────────
const leaderboardEntrySchema = new mongoose_1.Schema({
    rank: { type: Number, required: true, min: 1 },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    correctPredictions: { type: Number, required: true, min: 0, max: 5 },
    totalPredictions: { type: Number, required: true, default: 5 },
    submittedAt: { type: Date, required: true },
    isWinner: { type: Boolean, default: false },
    isPunished: { type: Boolean, default: false },
}, { _id: false });
// ─── Main Schema ───────────────────────────────────────────────────────────────
const leaderboardSchema = new mongoose_1.Schema({
    challengeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: [true, 'Challenge ID is required'],
        unique: true, // one leaderboard per challenge
    },
    matchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        required: [true, 'Match ID is required'],
    },
    stake: {
        type: String,
        default: 'Bragging rights',
        trim: true,
    },
    rankings: {
        type: [leaderboardEntrySchema],
        default: [],
    },
    winnerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    loserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    computedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ─── Indexes ───────────────────────────────────────────────────────────────────
leaderboardSchema.index({ challengeId: 1 }, { unique: true });
leaderboardSchema.index({ matchId: 1 });
leaderboardSchema.index({ winnerId: 1 });
leaderboardSchema.index({ computedAt: -1 });
// ─── Instance Methods ──────────────────────────────────────────────────────────
leaderboardSchema.methods.getWinner = function () {
    return this.rankings.find((r) => r.isWinner);
};
leaderboardSchema.methods.getLoser = function () {
    return this.rankings.find((r) => r.isPunished);
};
// ─── Static: build leaderboard from prediction scores ─────────────────────────
leaderboardSchema.statics.buildFromPredictions = function (predictions, challengeId, matchId, stake) {
    // Sort: highest score first; tiebreak by earliest submission
    const sorted = [...predictions].sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        return a.submittedAt.getTime() - b.submittedAt.getTime();
    });
    const rankings = sorted.map((p, i) => ({
        rank: i + 1,
        userId: p.userId,
        correctPredictions: p.score,
        totalPredictions: 5,
        submittedAt: p.submittedAt,
        isWinner: i === 0,
        isPunished: i === sorted.length - 1 && sorted.length > 1,
    }));
    return {
        challengeId,
        matchId,
        stake,
        rankings,
        winnerId: rankings[0]?.userId,
        loserId: rankings[rankings.length - 1]?.userId,
        computedAt: new Date(),
    };
};
// ─── Export ────────────────────────────────────────────────────────────────────
const Leaderboard = mongoose_1.default.model('Leaderboard', leaderboardSchema);
exports.default = Leaderboard;
