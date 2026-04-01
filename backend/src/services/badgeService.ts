import User, { IUser, BadgeType } from '../models/User';

interface PredictionLean {
  score:       number;
  isEvaluated: boolean;
  results?: {
    questionResults: boolean[]; totalCorrect: number;
  };
}

interface ChallengeLean {
  _id: unknown;
}

/**
 * TASK-16: Evaluate and award all eligible badges to a user.
 * Returns list of newly awarded badges.
 */
export async function awardBadges(
  user: IUser,
  predictions: PredictionLean[],
  challenges: ChallengeLean[]
): Promise<BadgeType[]> {
  const awarded: BadgeType[] = [];
  const evaluated = predictions.filter(p => p.isEvaluated);

  // ── Perfect Prediction: all answers correct in any single attempt ────────────────
  const hasPerfect = evaluated.some(p => p.results?.totalCorrect === (p.results?.questionResults?.length ?? 5) && p.results?.totalCorrect > 0);
  if (hasPerfect) awarded.push('perfect_prediction');

  // ── Win Streaks ─────────────────────────────────────────────────────────────
  const streak = user.stats.bestStreak;
  if (streak >= 3)  awarded.push('win_streak_3');
  if (streak >= 5)  awarded.push('win_streak_5');
  if (streak >= 10) awarded.push('win_streak_10');

  // ── Lone Wolf: correct match winner when majority chose opposite ─────────────
  // (Simplified: badge triggered externally via admin; just check if already present)

  // Save new badges
  for (const badge of awarded) {
    await user.addBadge(badge);
  }

  return awarded;
}

/**
 * Award badges after a match result is processed.
 * Called by resultService once predictions are evaluated.
 */
export async function evaluateBadgesForChallenge(challengeId: string): Promise<void> {
  const { default: Prediction } = await import('../models/Prediction');
  const { default: Challenge }  = await import('../models/Challenge');
  const { Types } = await import('mongoose');

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) return;

  const predictions = await Prediction.find({ challengeId: challenge._id }).lean();
  const scores      = predictions.map(p => p.score);
  const maxScore    = Math.max(...scores);

  for (const pred of predictions) {
    const user = await User.findById(pred.userId);
    if (!user) continue;

    const allPreds = await Prediction.find({ userId: user._id }).lean();
    const allChallenges = await Challenge.find({
      $or: [{ creatorId: user._id }, { 'participants.userId': user._id }],
    }).lean();

    await awardBadges(user, allPreds, allChallenges);

    // Lone Wolf: only one who got max score and > 1 participant
    if (pred.score === maxScore && scores.filter(s => s === maxScore).length === 1 && predictions.length > 1) {
      await user.addBadge('lone_wolf');
    }

    // Update best streak in stats
    const wins = user.stats.wins;
    if (wins > user.stats.bestStreak) {
      await User.findByIdAndUpdate(user._id, { 'stats.bestStreak': wins });
    }

    // Update accuracy
    if (allPreds.length > 0) {
      const totalCorrect = allPreds.reduce((sum, p) => sum + (p.results?.totalCorrect ?? 0), 0);
      const totalPossible = allPreds.reduce((sum, p) => sum + (p.results?.questionResults?.length ?? 5), 0);
      await user.updateAccuracy(totalCorrect, totalPossible);
    }
  }
}
