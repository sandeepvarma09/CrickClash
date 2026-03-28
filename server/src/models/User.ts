import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Badge Types ───────────────────────────────────────────────────────────────
export type BadgeType =
  | 'perfect_prediction'
  | 'win_streak_3'
  | 'win_streak_5'
  | 'win_streak_10'
  | 'weekly_champion'
  | 'lone_wolf';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface IUserStats {
  totalChallenges: number;
  wins:            number;
  losses:          number;
  winStreak:       number;
  bestStreak:      number;
  accuracy:        number; // 0–100 percentage of correct individual predictions
}

export interface IUser extends Document {
  username:    string;
  email?:      string;
  password?:   string;
  avatar:      string;
  stats:       IUserStats;
  badges:      BadgeType[];
  isAdmin:     boolean;
  lastSeen:    Date;
  createdAt:   Date;
  updatedAt:   Date;
  // Methods
  updateAccuracy(totalCorrect: number, totalPredictions: number): Promise<IUser>;
  addBadge(badge: BadgeType): Promise<IUser>;
}

// ─── Schema ────────────────────────────────────────────────────────────────────
const userStatsSchema = new Schema<IUserStats>(
  {
    totalChallenges: { type: Number, default: 0, min: 0 },
    wins:            { type: Number, default: 0, min: 0 },
    losses:          { type: Number, default: 0, min: 0 },
    winStreak:       { type: Number, default: 0, min: 0 },
    bestStreak:      { type: Number, default: 0, min: 0 },
    accuracy:        { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match:     [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
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
    avatar:  { type: String, default: '' },    // emoji or URL
    stats:   { type: userStatsSchema, default: () => ({}) },
    badges:  {
      type:    [String],
      enum:    ['perfect_prediction', 'win_streak_3', 'win_streak_5', 'win_streak_10', 'weekly_champion', 'lone_wolf'],
      default: [],
    },
    isAdmin:  { type: Boolean, default: false },
    lastSeen: { type: Date,    default: Date.now },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'stats.wins': -1 });
userSchema.index({ 'stats.winStreak': -1 });
userSchema.index({ createdAt: -1 });

// ─── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('winRate').get(function (this: IUser) {
  const total = this.stats.wins + this.stats.losses;
  return total === 0 ? 0 : Math.round((this.stats.wins / total) * 100);
});

// ─── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.updateAccuracy = async function (
  totalCorrect: number,
  totalPredictions: number
): Promise<IUser> {
  if (totalPredictions > 0) {
    this.stats.accuracy = Math.round((totalCorrect / totalPredictions) * 100);
  }
  return this.save() as unknown as Promise<IUser>;
};

userSchema.methods.addBadge = async function (badge: BadgeType): Promise<IUser> {
  if (!this.badges.includes(badge)) {
    this.badges.push(badge);
    return this.save() as unknown as Promise<IUser>;
  }
  return this;
};

// ─── Export ────────────────────────────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
