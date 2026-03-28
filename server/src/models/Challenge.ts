import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ─── Interfaces ────────────────────────────────────────────────────────────────
export type ChallengeStatus = 'open' | 'locked' | 'completed' | 'expired';

export interface IParticipant {
  userId:   Types.ObjectId;
  joinedAt: Date;
}

export interface IChallenge extends Document {
  challengeId:  string;           // short human-readable ID e.g. "abc123"
  matchId:      Types.ObjectId;
  creatorId:    Types.ObjectId;
  stake:        string;           // e.g. "Buy biryani for everyone"
  participants: IParticipant[];
  status:       ChallengeStatus;
  shareUrl:     string;
  expiresAt:    Date;
  createdAt:    Date;
  updatedAt:    Date;
  // Methods
  addParticipant(userId: Types.ObjectId): Promise<IChallenge>;
  hasParticipant(userId: Types.ObjectId): boolean;
  lock(): Promise<IChallenge>;
  complete(): Promise<IChallenge>;
}

// ─── Schema ────────────────────────────────────────────────────────────────────
const participantSchema = new Schema<IParticipant>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const challengeSchema = new Schema<IChallenge>(
  {
    challengeId: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      lowercase: true,
      index:    true,
    },
    matchId: {
      type:     Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match is required for a challenge'],
    },
    creatorId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Creator is required'],
    },
    stake: {
      type:      String,
      required:  [true, 'A stake is required to make it interesting!'],
      trim:      true,
      maxlength: [200, 'Stake description is too long'],
      default:   'Bragging rights 😤',
    },
    participants: {
      type:     [participantSchema],
      default:  [],
      validate: {
        validator: (v: IParticipant[]) => v.length <= 50,
        message:   'A challenge cannot have more than 50 participants',
      },
    },
    status: {
      type:    String,
      enum:    ['open', 'locked', 'completed', 'expired'],
      default: 'open',
    },
    shareUrl:  { type: String, default: '' },
    expiresAt: { type: Date,   required: true }, // typically set to match date
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
challengeSchema.index({ challengeId: 1 }, { unique: true });
challengeSchema.index({ matchId: 1 });
challengeSchema.index({ creatorId: 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // TTL: 7 days after expiresAt

// ─── Virtuals ──────────────────────────────────────────────────────────────────
challengeSchema.virtual('participantCount').get(function (this: IChallenge) {
  return this.participants.length;
});

challengeSchema.virtual('isOpen').get(function (this: IChallenge) {
  return this.status === 'open';
});

// ─── Instance Methods ──────────────────────────────────────────────────────────
challengeSchema.methods.hasParticipant = function (userId: Types.ObjectId): boolean {
  return (
    this.creatorId.equals(userId) ||
    this.participants.some((p: IParticipant) => p.userId.equals(userId))
  );
};

challengeSchema.methods.addParticipant = async function (
  userId: Types.ObjectId
): Promise<IChallenge> {
  if (!this.hasParticipant(userId)) {
    this.participants.push({ userId, joinedAt: new Date() });
    return this.save();
  }
  return this;
};

challengeSchema.methods.lock = async function (): Promise<IChallenge> {
  this.status = 'locked';
  return this.save();
};

challengeSchema.methods.complete = async function (): Promise<IChallenge> {
  this.status = 'completed';
  return this.save();
};

// ─── Export ────────────────────────────────────────────────────────────────────
const Challenge: Model<IChallenge> = mongoose.model<IChallenge>('Challenge', challengeSchema);
export default Challenge;
