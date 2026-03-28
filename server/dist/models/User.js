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
// ─── Schema ────────────────────────────────────────────────────────────────────
const userStatsSchema = new mongoose_1.Schema({
    totalChallenges: { type: Number, default: 0, min: 0 },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    winStreak: { type: Number, default: 0, min: 0 },
    bestStreak: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [2, 'Username must be at least 2 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        select: false,
    },
    avatar: { type: String, default: '' }, // emoji or URL
    stats: { type: userStatsSchema, default: () => ({}) },
    badges: {
        type: [String],
        enum: ['perfect_prediction', 'win_streak_3', 'win_streak_5', 'win_streak_10', 'weekly_champion', 'lone_wolf'],
        default: [],
    },
    isAdmin: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'stats.wins': -1 });
userSchema.index({ 'stats.winStreak': -1 });
userSchema.index({ createdAt: -1 });
// ─── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('winRate').get(function () {
    const total = this.stats.wins + this.stats.losses;
    return total === 0 ? 0 : Math.round((this.stats.wins / total) * 100);
});
// ─── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.updateAccuracy = async function (totalCorrect, totalPredictions) {
    if (totalPredictions > 0) {
        this.stats.accuracy = Math.round((totalCorrect / totalPredictions) * 100);
    }
    return this.save();
};
userSchema.methods.addBadge = async function (badge) {
    if (!this.badges.includes(badge)) {
        this.badges.push(badge);
        return this.save();
    }
    return this;
};
// ─── Export ────────────────────────────────────────────────────────────────────
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
