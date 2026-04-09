import { Request, Response } from 'express';
import Challenge  from '../models/Challenge';
import User       from '../models/User';
import Prediction from '../models/Prediction';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess }            from '../utils/response';

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function ensureUser(username: string) {
  const name = username.trim().toLowerCase();
  let user   = await User.findOne({ username: name });
  if (!user) user = await User.create({ username: name, stats: {}, badges: [] });
  return user;
}

// ─── POST /api/predictions ─────────────────────────────────────────────────────
/**
 * Body: { challengeId (short), username, predictions: { tossWinner, matchWinner,
 *          topRunScorer, totalRunsByWinner, playerOfTheMatch } }
 */
export const submitPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { challengeId: shortId, username, stake, predictions } = req.body;

  if (!shortId)    throw new AppError('challengeId is required', 400);
  if (!username)   throw new AppError('username is required', 400);
  if (!predictions) throw new AppError('predictions object is required', 400);

  const questionAnswers = Array.isArray(predictions.questionAnswers) ? predictions.questionAnswers : 
    (predictions ? Object.values(predictions).map(String) : []);

  if (questionAnswers.length === 0) {
    throw new AppError('Predictions are required', 400);
  }

  // Find challenge
  const challenge = await Challenge.findOne({ challengeId: shortId }).populate('matchId');
  if (!challenge) throw new AppError('Challenge not found', 404);
  if (challenge.status !== 'open') throw new AppError('This challenge is no longer accepting predictions', 400);

  // Ensure user + check not creator
  const user = await ensureUser(username);

  // Check duplicate
  const existing = await Prediction.findOne({ challengeId: challenge._id, userId: user._id });
  if (existing) throw new AppError('You have already submitted predictions for this challenge', 409);

  // Add participant if not already listed
  if (!challenge.hasParticipant(user._id)) {
    await challenge.addParticipant(user._id);
  }

  // Save prediction
  const prediction = await Prediction.create({
    challengeId: challenge._id,
    userId:      user._id,
    stake:       stake?.trim() || '',
    answers: {
      questionAnswers,
    },
  });

  sendSuccess(res, { prediction, challengeId: shortId }, 'Predictions submitted successfully!', 201);
});

// ─── GET /api/predictions/:challengeId/:username ──────────────────────────────
export const getUserPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { challengeId: shortId, userId: username } = req.params;

  const challenge = await Challenge.findOne({ challengeId: shortId });
  if (!challenge) throw new AppError('Challenge not found', 404);

  const user = await User.findOne({ username: String(username).trim().toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  const prediction = await Prediction.findOne({ challengeId: challenge._id, userId: user._id })
    .populate('userId', 'username avatar')
    .lean();

  if (!prediction) throw new AppError('No prediction found for this user in this challenge', 404);

  sendSuccess(res, prediction, 'Prediction fetched');
});
