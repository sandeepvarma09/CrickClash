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
// ─── Sub-schema: answers ───────────────────────────────────────────────────────
const answersSchema = new mongoose_1.Schema({
    questionAnswers: { type: [String], required: true },
}, { _id: false });
// ─── Sub-schema: results ───────────────────────────────────────────────────────
const resultsSchema = new mongoose_1.Schema({
    questionResults: { type: [Boolean], required: true },
    totalCorrect: { type: Number, required: true, min: 0 },
}, { _id: false });
// ─── Main Schema ───────────────────────────────────────────────────────────────
const predictionSchema = new mongoose_1.Schema({
    challengeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: [true, 'Challenge ID is required'],
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    answers: { type: answersSchema, required: true },
    score: { type: Number, default: 0, min: 0, max: 5 },
    submittedAt: { type: Date, default: Date.now },
    isEvaluated: { type: Boolean, default: false },
    results: { type: resultsSchema, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ─── Compound unique index — one prediction per user per challenge ──────────────
predictionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
predictionSchema.index({ challengeId: 1, score: -1 });
predictionSchema.index({ userId: 1 });
predictionSchema.index({ submittedAt: 1 });
// ─── Virtuals ──────────────────────────────────────────────────────────────────
predictionSchema.virtual('accuracy').get(function () {
    return `${this.score}/5`;
});
// ─── Instance Method: evaluate ─────────────────────────────────────────────────
/**
 * Compare prediction answers against actual match correct answers.
 */
predictionSchema.methods.evaluate = async function (matchQuestions) {
    const a = this.answers;
    const ans = a.questionAnswers || [];
    const questionResults = matchQuestions.map((mq, index) => {
        const userAns = ans[index] || '';
        const correctAns = mq.correctAnswer || '';
        // Treat numbers separately for ±10 tolerance if needed, but since it's dynamic we just do exact match or within tolerance for runs
        if (mq.correctAnswer && !isNaN(Number(mq.correctAnswer)) && !isNaN(Number(userAns)) && Number(mq.correctAnswer) > 20) {
            return Math.abs(Number(userAns) - Number(mq.correctAnswer)) <= 10;
        }
        return normalize(userAns) === normalize(correctAns);
    });
    const totalCorrect = questionResults.filter(Boolean).length;
    this.results = {
        questionResults,
        totalCorrect,
    };
    this.score = totalCorrect;
    this.isEvaluated = true;
    return this.save();
};
/** Case-insensitive trim for comparison */
function normalize(s) {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
// ─── Export ────────────────────────────────────────────────────────────────────
const Prediction = mongoose_1.default.model('Prediction', predictionSchema);
exports.default = Prediction;
