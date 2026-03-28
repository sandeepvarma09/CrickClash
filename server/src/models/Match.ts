import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchFormat = 'IPL' | 'T20' | 'ODI' | 'TEST';

export interface IQuestion {
  question: string;
  options:  string[];
  correctAnswer?: string;   // filled when admin sets result
}

export interface ITeam {
  name:      string;
  shortName: string;
  flagUrl:   string;
}

export interface IMatchResult {
  tossWinner:          string;
  matchWinner:         string;
  topRunScorer:        string;
  totalRunsByWinner:   number;
  playerOfTheMatch:    string;
  margin?:             string;   // e.g. "by 6 wickets"
  resultSummary?:      string;   // e.g. "India won by 6 wickets"
}

export interface IMatch extends Document {
  teams:         [ITeam, ITeam];
  date:          Date;
  venue:         string;
  city:          string;
  format:        MatchFormat;
  status:        MatchStatus;
  result?:       IMatchResult;
  questions:     IQuestion[];    // admin-defined prediction questions (up to 4)
  externalId?:   string;        // CricAPI / RapidAPI match ID
  seriesName?:   string;        // e.g. "IPL 2025"
  isAdded:       boolean;       // manually added by admin
  createdAt:     Date;
  updatedAt:     Date;
  isResultComplete(): boolean;
}

// ─── Sub-schemas ───────────────────────────────────────────────────────────────
const teamSchema = new Schema<ITeam>(
  {
    name:      { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true, maxlength: 5 },
    flagUrl:   { type: String, default: '' },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    question:      { type: String, required: true, trim: true },
    options:       [{ type: String, trim: true }],
    correctAnswer: { type: String, default: '' },
  },
  { _id: false }
);

const matchResultSchema = new Schema<IMatchResult>(
  {
    tossWinner:        { type: String, required: true },
    matchWinner:       { type: String, required: true },
    topRunScorer:      { type: String, required: true },
    totalRunsByWinner: { type: Number, required: true, min: 0 },
    playerOfTheMatch:  { type: String, required: true },
    margin:            { type: String, default: '' },
    resultSummary:     { type: String, default: '' },
  },
  { _id: false }
);

// ─── Schema ────────────────────────────────────────────────────────────────────
const matchSchema = new Schema<IMatch>(
  {
    teams:       {
      type:     [teamSchema],
      required: true,
      validate: [(v: ITeam[]) => v.length === 2, 'Exactly 2 teams required'],
    },
    date:        { type: Date,   required: [true, 'Match date is required'] },
    venue:       { type: String, required: [true, 'Venue is required'], trim: true },
    city:        { type: String, required: [true, 'City is required'],  trim: true },
    format:      {
      type:    String,
      enum:    ['IPL', 'T20', 'ODI', 'TEST'],
      default: 'T20',
    },
    questions:   { type: [questionSchema], default: [] },
    status:      {
      type:    String,
      enum:    ['upcoming', 'live', 'completed', 'abandoned'],
      default: 'upcoming',
    },
    result:      { type: matchResultSchema, default: null },
    externalId:  { type: String, default: '', index: true },
    seriesName:  { type: String, default: '', trim: true },
    isAdded:     { type: Boolean, default: false }, // true = manually added by admin
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
matchSchema.index({ status: 1, date: 1 });
matchSchema.index({ date: -1 });
matchSchema.index({ externalId: 1 }, { sparse: true });

// ─── Virtuals ──────────────────────────────────────────────────────────────────
matchSchema.virtual('teamNames').get(function (this: IMatch) {
  return this.teams.map((t) => t.name).join(' vs ');
});

matchSchema.virtual('isUpcoming').get(function (this: IMatch) {
  return this.status === 'upcoming' && this.date > new Date();
});

// ─── Instance Methods ──────────────────────────────────────────────────────────
matchSchema.methods.isResultComplete = function (): boolean {
  if (!this.result) return false;
  const r = this.result;
  return !!(
    r.tossWinner &&
    r.matchWinner &&
    r.topRunScorer &&
    r.totalRunsByWinner >= 0 &&
    r.playerOfTheMatch
  );
};

// ─── Export ────────────────────────────────────────────────────────────────────
const Match: Model<IMatch> = mongoose.model<IMatch>('Match', matchSchema);
export default Match;
