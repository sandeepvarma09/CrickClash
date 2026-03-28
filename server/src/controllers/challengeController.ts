import { Request, Response } from 'express';
import Challenge from '../models/Challenge';
import Match     from '../models/Match';
import User      from '../models/User';
import Prediction from '../models/Prediction';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess }            from '../utils/response';
import { generateShortId }        from '../utils/response';

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Ensure a User doc exists for a given username, create if not */
async function ensureUser(username: string) {
  username = username.trim().toLowerCase();
  let user = await User.findOne({ username });
  if (!user) {
    user = await User.create({ username, stats: {}, badges: [] });
  }
  return user;
}

/** Generate a unique challengeId (retry on collision) */
async function uniqueChallengeId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = generateShortId(6);
    const exists = await Challenge.exists({ challengeId: id });
    if (!exists) return id;
  }
  return generateShortId(10); // fallback: longer ID
}

// ─── POST /api/challenges ──────────────────────────────────────────────────────
export const createChallenge = asyncHandler(async (req: Request, res: Response) => {
  const { matchId, username, stake, predictions } = req.body;

  if (!matchId)   throw new AppError('matchId is required', 400);
  if (!username)  throw new AppError('username is required', 400);

  // Fetch match first (need it for questions/defaults)
  const match = await Match.findById(matchId);
  if (!match) throw new AppError('Match not found', 404);
  if (match.status === 'completed') throw new AppError('Cannot create a challenge for a completed match', 400);

  // Make answers dynamic if they pass questionAnswers array inside predictions
  const questionAnswers = Array.isArray(predictions?.questionAnswers) ? predictions.questionAnswers : 
    (predictions ? Object.values(predictions).map(String) : []);
  
  const answers = {
    questionAnswers
  };

  // Ensure user
  const user = await ensureUser(username);

  // Generate unique short ID and shareUrl
  const challengeId = await uniqueChallengeId();
  const shareUrl    = `${CLIENT_URL}/challenge/${challengeId}`;

  // Create the challenge
  const challenge = await Challenge.create({
    challengeId,
    matchId:   match._id,
    creatorId: user._id,
    stake:     stake?.trim() || 'Bragging rights 😤',
    shareUrl,
    expiresAt: match.date,
    participants: [],
  });

  // Create the creator's prediction
  await Prediction.create({
    challengeId: challenge._id,
    userId:      user._id,
    answers,
  });

  sendSuccess(res, { challenge, shareUrl, challengeId }, 'Challenge created successfully!', 201);
});

// ─── GET /api/challenges/:id ───────────────────────────────────────────────────
export const getChallengeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const challenge = await Challenge.findOne({ challengeId: id })
    // Populate questions so the join-form can render them dynamically
    .populate('matchId', 'teams date venue format status seriesName questions')
    .populate('creatorId', 'username avatar')
    .lean();

  if (!challenge) throw new AppError('Challenge not found', 404);

  // Fetch creator's prediction
  const creatorPrediction = await Prediction.findOne({
    challengeId: challenge._id,
    userId:      challenge.creatorId,
  }).lean();

  sendSuccess(res, { challenge, creatorPrediction }, 'Challenge fetched successfully');
});

// ─── GET /api/challenges/:id/predictions ──────────────────────────────────────
export const getChallengePredictions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const challenge = await Challenge.findOne({ challengeId: id }).lean();
  if (!challenge) throw new AppError('Challenge not found', 404);

  const predictions = await Prediction.find({ challengeId: challenge._id })
    .populate('userId', 'username avatar')
    .sort({ submittedAt: 1 })
    .lean();

  sendSuccess(res, predictions, `${predictions.length} prediction(s) found`);
});

// ─── GET /api/challenges/:id/results ──────────────────────────────────────────
export const getChallengeResults = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const challenge = await Challenge.findOne({ challengeId: id })
    .populate('matchId')
    .lean();
  if (!challenge) throw new AppError('Challenge not found', 404);

  const match = challenge.matchId as unknown as { status: string; result?: Record<string, unknown> };
  if (match.status !== 'completed') {
    throw new AppError('Match has not ended yet — results not available', 400);
  }

  const predictions = await Prediction.find({ challengeId: challenge._id })
    .populate('userId', 'username avatar')
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  sendSuccess(res, { challenge, predictions }, 'Results fetched');
});

// ─── GET /api/challenges/:id/leaderboard ──────────────────────────────────────
export const getChallengeLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const challenge = await Challenge.findOne({ challengeId: id }).lean();
  if (!challenge) throw new AppError('Challenge not found', 404);

  const predictions = await Prediction.find({ challengeId: challenge._id })
    .populate('userId', 'username avatar')
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  const rankings = predictions.map((p, index) => ({
    rank:               index + 1,
    user:               p.userId,
    score:              p.score,
    answers:            p.answers,
    results:            p.results,
    isWinner:           index === 0,
    isPunished:         index === predictions.length - 1 && predictions.length > 1,
    submittedAt:        p.submittedAt,
  }));

  sendSuccess(res, { challenge, rankings, stake: challenge.stake }, 'Leaderboard fetched');
});
