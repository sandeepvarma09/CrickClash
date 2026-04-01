import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface ILeaderboardEntry {
  rank:               number;
  userId:             Types.ObjectId;
  correctPredictions: number;   // 0–5
  totalPredictions:   number;   // always 5
  submittedAt:        Date;     // used as tiebreaker (earlier = better)
  isWinner:           boolean;
  isPunished:         boolean;  // last place
}

export interface ILeaderboard extends Document {
  challengeId:  Types.ObjectId;
  matchId:      Types.ObjectId;
  stake:        string;
  rankings:     ILeaderboardEntry[];
  winnerId?:    Types.ObjectId;
  loserId?:     Types.ObjectId;
  computedAt:   Date;
  createdAt:    Date;
  updatedAt:    Date;
  // Methods
  getWinner(): ILeaderboardEntry | undefined;
  getLoser():  ILeaderboardEntry | undefined;
}

// ─── Sub-schema: ranking entry ─────────────────────────────────────────────────
const leaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    rank:               { type: Number,  required: true, min: 1 },
    userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
    correctPredictions: { type: Number,  required: true, min: 0,  max: 5 },
    totalPredictions:   { type: Number,  required: true, default: 5 },
    submittedAt:        { type: Date,    required: true },
    isWinner:           { type: Boolean, default: false },
    isPunished:         { type: Boolean, default: false },
  },
  { _id: false }
);

// ─── Main Schema ───────────────────────────────────────────────────────────────
const leaderboardSchema = new Schema<ILeaderboard>(
  {
    challengeId: {
      type:     Schema.Types.ObjectId,
      ref:      'Challenge',
      required: [true, 'Challenge ID is required'],
      unique:   true,       // one leaderboard per challenge
    },
    matchId: {
      type:     Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match ID is required'],
    },
    stake: {
      type:    String,
      default: 'Bragging rights',
      trim:    true,
    },
    rankings: {
      type:    [leaderboardEntrySchema],
      default: [],
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    loserId: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    computedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
leaderboardSchema.index({ challengeId: 1 }, { unique: true });
leaderboardSchema.index({ matchId: 1 });
leaderboardSchema.index({ winnerId: 1 });
leaderboardSchema.index({ computedAt: -1 });

// ─── Instance Methods ──────────────────────────────────────────────────────────
leaderboardSchema.methods.getWinner = function (): ILeaderboardEntry | undefined {
  return this.rankings.find((r: ILeaderboardEntry) => r.isWinner);
};

leaderboardSchema.methods.getLoser = function (): ILeaderboardEntry | undefined {
  return this.rankings.find((r: ILeaderboardEntry) => r.isPunished);
};

// ─── Static: build leaderboard from prediction scores ─────────────────────────
leaderboardSchema.statics.buildFromPredictions = function (
  predictions: Array<{
    userId:      Types.ObjectId;
    score:       number;
    submittedAt: Date;
  }>,
  challengeId: Types.ObjectId,
  matchId:     Types.ObjectId,
  stake:       string
): Partial<ILeaderboard> {
  // Sort: highest score first; tiebreak by earliest submission
  const sorted = [...predictions].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });

  const rankings: ILeaderboardEntry[] = sorted.map((p, i) => ({
    rank:               i + 1,
    userId:             p.userId,
    correctPredictions: p.score,
    totalPredictions:   5,
    submittedAt:        p.submittedAt,
    isWinner:           i === 0,
    isPunished:         i === sorted.length - 1 && sorted.length > 1,
  }));

  return {
    challengeId,
    matchId,
    stake,
    rankings,
    winnerId: rankings[0]?.userId,
    loserId:  rankings[rankings.length - 1]?.userId,
    computedAt: new Date(),
  };
};

// ─── Export ────────────────────────────────────────────────────────────────────
const Leaderboard: Model<ILeaderboard> = mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);
export default Leaderboard;
