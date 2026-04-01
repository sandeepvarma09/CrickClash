import Prediction from '../models/Prediction';
import Leaderboard from '../models/Leaderboard';
import Challenge   from '../models/Challenge';
import Match       from '../models/Match';
import User        from '../models/User';
import { Types }   from 'mongoose';
import { awardBadges } from './badgeService';

/**
 * TASK-13: Evaluate all predictions for every open challenge tied to a match,
 * then compute and upsert leaderboards.
 */
export async function evaluateChallengesForMatch(matchId: string): Promise<{
  challengesProcessed: number;
  predictionsEvaluated: number;
}> {
  const match = await Match.findById(matchId);
  if (!match?.questions) throw new Error('Match has no questions to evaluate against');

  // Find all challenges for this match
  const challenges = await Challenge.find({ matchId: new Types.ObjectId(matchId) });

  let predictionsEvaluated = 0;

  for (const challenge of challenges) {
    // Get all predictions for the challenge
    const predictions = await Prediction.find({ challengeId: challenge._id });

    // Evaluate each un-evaluated prediction
    for (const pred of predictions) {
      if (!pred.isEvaluated) {
        await pred.evaluate(match.questions as { correctAnswer: string }[]);
        predictionsEvaluated++;
      }
    }

    // Re-fetch predictions with updated scores
    const evaluated = await Prediction.find({ challengeId: challenge._id }).lean();

    // Build leaderboard data using the static method
    const lbData = (Leaderboard as unknown as {
      buildFromPredictions: (
        preds: Array<{ userId: Types.ObjectId; score: number; submittedAt: Date }>,
        challengeId: Types.ObjectId,
        matchId: Types.ObjectId,
        stake: string
      ) => Partial<typeof Leaderboard>
    }).buildFromPredictions(
      evaluated.map(p => ({
        userId:      p.userId as unknown as Types.ObjectId,
        score:       p.score,
        submittedAt: p.submittedAt,
      })),
      challenge._id as unknown as Types.ObjectId,
      new Types.ObjectId(matchId),
      challenge.stake
    );

    // Upsert the leaderboard
    await Leaderboard.findOneAndUpdate(
      { challengeId: challenge._id },
      lbData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mark challenge as completed
    await challenge.complete();

    // ── TASK-16: Award badges to all participants ────────────────────────────
    try {
      const { evaluateBadgesForChallenge } = await import('./badgeService');
      await evaluateBadgesForChallenge(String(challenge._id));
    } catch (e) {
      console.warn('Badge evaluation failed:', e);
    }

    // Update participant user stats
    for (const pred of evaluated) {
      await User.findByIdAndUpdate(pred.userId, {
        $inc: {
          'stats.totalChallenges': 1,
          'stats.wins':  pred.score === Math.max(...evaluated.map(p => p.score)) ? 1 : 0,
          'stats.losses': pred.score === Math.min(...evaluated.map(p => p.score)) ? 1 : 0,
        },
      });
    }
  }

  return { challengesProcessed: challenges.length, predictionsEvaluated };
}

/**
 * Get global leaderboard — top users by wins across all challenges
 */
export async function getGlobalLeaderboard(limit = 20) {
  return User.find({ 'stats.totalChallenges': { $gt: 0 }, isAdmin: { $ne: true } })
    .sort({ 'stats.wins': -1, 'stats.accuracy': -1 })
    .limit(limit)
    .select('username avatar stats badges')
    .lean();
}
