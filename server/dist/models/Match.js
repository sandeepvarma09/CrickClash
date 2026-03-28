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
// ─── Sub-schemas ───────────────────────────────────────────────────────────────
const teamSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true, maxlength: 5 },
    flagUrl: { type: String, default: '' },
}, { _id: false });
const questionSchema = new mongoose_1.Schema({
    question: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, default: '' },
}, { _id: false });
const matchResultSchema = new mongoose_1.Schema({
    tossWinner: { type: String, required: true },
    matchWinner: { type: String, required: true },
    topRunScorer: { type: String, required: true },
    totalRunsByWinner: { type: Number, required: true, min: 0 },
    playerOfTheMatch: { type: String, required: true },
    margin: { type: String, default: '' },
    resultSummary: { type: String, default: '' },
}, { _id: false });
// ─── Schema ────────────────────────────────────────────────────────────────────
const matchSchema = new mongoose_1.Schema({
    teams: {
        type: [teamSchema],
        required: true,
        validate: [(v) => v.length === 2, 'Exactly 2 teams required'],
    },
    date: { type: Date, required: [true, 'Match date is required'] },
    venue: { type: String, required: [true, 'Venue is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    format: {
        type: String,
        enum: ['IPL', 'T20', 'ODI', 'TEST'],
        default: 'T20',
    },
    questions: { type: [questionSchema], default: [] },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'completed', 'abandoned'],
        default: 'upcoming',
    },
    result: { type: matchResultSchema, default: null },
    externalId: { type: String, default: '', index: true },
    seriesName: { type: String, default: '', trim: true },
    isAdded: { type: Boolean, default: false }, // true = manually added by admin
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ─── Indexes ───────────────────────────────────────────────────────────────────
matchSchema.index({ status: 1, date: 1 });
matchSchema.index({ date: -1 });
matchSchema.index({ externalId: 1 }, { sparse: true });
// ─── Virtuals ──────────────────────────────────────────────────────────────────
matchSchema.virtual('teamNames').get(function () {
    return this.teams.map((t) => t.name).join(' vs ');
});
matchSchema.virtual('isUpcoming').get(function () {
    return this.status === 'upcoming' && this.date > new Date();
});
// ─── Instance Methods ──────────────────────────────────────────────────────────
matchSchema.methods.isResultComplete = function () {
    if (!this.result)
        return false;
    const r = this.result;
    return !!(r.tossWinner &&
        r.matchWinner &&
        r.topRunScorer &&
        r.totalRunsByWinner >= 0 &&
        r.playerOfTheMatch);
};
// ─── Export ────────────────────────────────────────────────────────────────────
const Match = mongoose_1.default.model('Match', matchSchema);
exports.default = Match;
