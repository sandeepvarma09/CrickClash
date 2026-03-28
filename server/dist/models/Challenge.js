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
const participantSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
}, { _id: false });
const challengeSchema = new mongoose_1.Schema({
    challengeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    matchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        required: [true, 'Match is required for a challenge'],
    },
    creatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required'],
    },
    stake: {
        type: String,
        required: [true, 'A stake is required to make it interesting!'],
        trim: true,
        maxlength: [200, 'Stake description is too long'],
        default: 'Bragging rights 😤',
    },
    participants: {
        type: [participantSchema],
        default: [],
        validate: {
            validator: (v) => v.length <= 50,
            message: 'A challenge cannot have more than 50 participants',
        },
    },
    status: {
        type: String,
        enum: ['open', 'locked', 'completed', 'expired'],
        default: 'open',
    },
    shareUrl: { type: String, default: '' },
    expiresAt: { type: Date, required: true }, // typically set to match date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ─── Indexes ───────────────────────────────────────────────────────────────────
challengeSchema.index({ challengeId: 1 }, { unique: true });
challengeSchema.index({ matchId: 1 });
challengeSchema.index({ creatorId: 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // TTL: 7 days after expiresAt
// ─── Virtuals ──────────────────────────────────────────────────────────────────
challengeSchema.virtual('participantCount').get(function () {
    return this.participants.length;
});
challengeSchema.virtual('isOpen').get(function () {
    return this.status === 'open';
});
// ─── Instance Methods ──────────────────────────────────────────────────────────
challengeSchema.methods.hasParticipant = function (userId) {
    return (this.creatorId.equals(userId) ||
        this.participants.some((p) => p.userId.equals(userId)));
};
challengeSchema.methods.addParticipant = async function (userId) {
    if (!this.hasParticipant(userId)) {
        this.participants.push({ userId, joinedAt: new Date() });
        return this.save();
    }
    return this;
};
challengeSchema.methods.lock = async function () {
    this.status = 'locked';
    return this.save();
};
challengeSchema.methods.complete = async function () {
    this.status = 'completed';
    return this.save();
};
// ─── Export ────────────────────────────────────────────────────────────────────
const Challenge = mongoose_1.default.model('Challenge', challengeSchema);
exports.default = Challenge;
