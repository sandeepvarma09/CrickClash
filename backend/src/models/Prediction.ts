import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface IPredictionAnswers {
  questionAnswers: string[];
}

export interface IPredictionResults {
  questionResults: boolean[];
  totalCorrect:    number;
}

export interface IPrediction extends Document {
  challengeId:  Types.ObjectId;
  userId:       Types.ObjectId;
  answers:      IPredictionAnswers;
  score:        number;           // computed after match: 0–5
  submittedAt:  Date;
  isEvaluated:  boolean;
  results?:     IPredictionResults;
  createdAt:    Date;
  updatedAt:    Date;
  // Methods
  evaluate(matchQuestions: { correctAnswer: string }[]): Promise<IPrediction>;
}

// ─── Sub-schema: answers ───────────────────────────────────────────────────────
const answersSchema = new Schema<IPredictionAnswers>(
  {
    questionAnswers: { type: [String], required: true },
  },
  { _id: false }
);

// ─── Sub-schema: results ───────────────────────────────────────────────────────
const resultsSchema = new Schema<IPredictionResults>(
  {
    questionResults: { type: [Boolean], required: true },
    totalCorrect:    { type: Number,  required: true, min: 0 },
  },
  { _id: false }
);

// ─── Main Schema ───────────────────────────────────────────────────────────────
const predictionSchema = new Schema<IPrediction>(
  {
    challengeId: {
      type:     Schema.Types.ObjectId,
      ref:      'Challenge',
      required: [true, 'Challenge ID is required'],
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User ID is required'],
    },
    answers:     { type: answersSchema, required: true },
    score:       { type: Number, default: 0, min: 0, max: 5 },
    submittedAt: { type: Date,   default: Date.now },
    isEvaluated: { type: Boolean, default: false },
    results:     { type: resultsSchema, default: null },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Compound unique index — one prediction per user per challenge ──────────────
predictionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
predictionSchema.index({ challengeId: 1, score: -1 });
predictionSchema.index({ userId: 1 });
predictionSchema.index({ submittedAt: 1 });

// ─── Virtuals ──────────────────────────────────────────────────────────────────
predictionSchema.virtual('accuracy').get(function (this: IPrediction) {
  return `${this.score}/5`;
});

// ─── Instance Method: evaluate ─────────────────────────────────────────────────
/**
 * Compare prediction answers against actual match correct answers.
 */
predictionSchema.methods.evaluate = async function (
  matchQuestions: { correctAnswer: string }[]
): Promise<IPrediction> {
  const a = this.answers as IPredictionAnswers;
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
  this.score       = totalCorrect;
  this.isEvaluated = true;

  return this.save();
};

/** Case-insensitive trim for comparison */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ─── Export ────────────────────────────────────────────────────────────────────
const Prediction: Model<IPrediction> = mongoose.model<IPrediction>('Prediction', predictionSchema);
export default Prediction;
