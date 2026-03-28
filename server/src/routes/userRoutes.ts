import { Router } from 'express';
import User        from '../models/User';
import Prediction  from '../models/Prediction';
import Challenge   from '../models/Challenge';
import bcrypt      from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { awardBadges } from '../services/badgeService';

const router = Router();

// ─── GET /api/users/:username ──────────────────────────────────────────────────
router.get('/:username', asyncHandler(async (req, res) => {
  const username = String(req.params.username).trim().toLowerCase();
  const user = await User.findOne({ username }).lean();
  if (!user) throw new AppError('User not found', 404);

  // Fetch their 5 most recent challenge predictions
  const recentPredictions = await Prediction.find({ userId: user._id })
    .sort({ submittedAt: -1 })
    .limit(5)
    .populate({
      path: 'challengeId',
      select: 'challengeId stake status matchId',
      populate: { path: 'matchId', select: 'teams date format status questions' },
    })
    .lean();

  sendSuccess(res, { user, recentPredictions }, 'User profile fetched');
}));

// ─── POST /api/users — create / ensure user ────────────────────────────────────
// ─── POST /api/users/register ──────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) throw new AppError('Username, email, and password are required', 400);

  const name = username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();

  // TASK-AUTH: Validate email format and password length
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mail)) throw new AppError('Invalid email format', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const existing = await User.findOne({ $or: [{ username: name }, { email: mail }] });
  if (existing) throw new AppError('Username or email already exists', 400);

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    username: name,
    email: mail,
    password: hashedPassword,
    isAdmin: mail === 'admin@example.com' || name === 'admin',
  });

  sendSuccess(res, { username: user.username, email: user.email, isAdmin: user.isAdmin }, 'Registration successful', 201);
}));

// ─── POST /api/users/login ─────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const mail = email.trim().toLowerCase();
  const user = await User.findOne({ email: mail }).select('+password').lean();

  if (!user || !user.password) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  sendSuccess(res, { username: user.username, email: user.email, isAdmin: user.isAdmin }, 'Login successful');
}));

// ─── Legacy POST /api/users (used by old app functionality) ──────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) throw new AppError('username is required', 400);

  const name = username.trim().toLowerCase();
  let user   = await User.findOne({ username: name });

  if (!user) {
    user = await User.create({ username: name, isAdmin: name === 'admin' });
  }

  sendSuccess(res, user, user.isNew ? 'User created' : 'User found');
}));

// ─── POST /api/users/:username/badges/evaluate ────────────────────────────────
// Manually trigger badge evaluation for a user (admin utility)
router.post('/:username/badges/evaluate', asyncHandler(async (req, res) => {
  const username = String(req.params.username).trim().toLowerCase();
  const user = await User.findOne({ username });
  if (!user) throw new AppError('User not found', 404);

  const predictions = await Prediction.find({ userId: user._id }).lean();
  const challenges  = await Challenge.find({ creatorId: user._id }).lean();

  const awarded = await awardBadges(user, predictions, challenges);
  sendSuccess(res, { user: await User.findById(user._id).lean(), awarded }, 'Badges evaluated');
}));

// ─── GET /api/users/:username/notifications/latest ────────────────────────────
// Fetches the most recent completed challenge result for pop-up display
router.get('/:username/notifications/latest', asyncHandler(async (req, res) => {
  const username = String(req.params.username).trim().toLowerCase();
  const user = await User.findOne({ username }).lean();
  if (!user) throw new AppError('User not found', 404);

  // Find the most recent completed challenge this user participated in
  const latestResult = await Prediction.findOne({ userId: user._id, isEvaluated: true })
    .sort({ submittedAt: -1 })
    .populate({
      path: 'challengeId',
      select: 'challengeId stake status matchId',
      populate: { path: 'matchId', select: 'teams' },
    })
    .lean();

  if (!latestResult) return sendSuccess(res, null, 'No recent results');

  // Also find the winner and loser scores
  const challengeId = latestResult.challengeId._id;
  const allParticipants = await Prediction.find({ challengeId }).populate('userId', 'username').lean();
  
  const scores = allParticipants.map(p => p.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  const winners = allParticipants.filter(p => p.score === maxScore).map(p => (p.userId as any).username);
  const losers  = allParticipants.filter(p => p.score === minScore).map(p => (p.userId as any).username);

  sendSuccess(res, {
    challenge: latestResult.challengeId,
    userScore: latestResult.score,
    winners,
    losers,
    stake: (latestResult.challengeId as any).stake,
    match: (latestResult.challengeId as any).matchId,
  }, 'Latest notification fetched');
  return;
}));

// ─── GET /api/users/:username/predictions ─────────────────────────────────────
// Fetches all challenges/predictions for the "My Challenges" page
router.get('/:username/predictions', asyncHandler(async (req, res) => {
  const username = String(req.params.username).trim().toLowerCase();
  const user = await User.findOne({ username }).lean();
  if (!user) throw new AppError('User not found', 404);

  const predictions = await Prediction.find({ userId: user._id })
    .sort({ submittedAt: -1 })
    .populate({
      path: 'challengeId',
      select: 'challengeId stake status matchId',
      populate: { path: 'matchId', select: 'teams date format status questions' },
    })
    .lean();

  sendSuccess(res, predictions, 'User predictions fetched');
  return;
}));

export default router;
