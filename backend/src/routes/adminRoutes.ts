import { Router, Request, Response, NextFunction } from 'express';
import Match     from '../models/Match';
import Challenge from '../models/Challenge';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import jwt from 'jsonwebtoken';

const router = Router();

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'admin123';
const JWT_SECRET = process.env.JWT_SECRET     ?? 'cricclash_secret_2026';

// ── Admin auth middleware ───────────────────────────────────────────────────────
function adminGuard(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'] as string | undefined;
  if (!token) throw new AppError('Admin token required', 401);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    throw new AppError('Invalid or expired admin token', 401);
  }
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) throw new AppError('username and password required', 400);

  const usernameOk = username.trim() === ADMIN_USER;
  const passwordOk = password       === ADMIN_PASS;

  if (!usernameOk || !passwordOk) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ role: 'admin', sub: username }, JWT_SECRET, { expiresIn: '8h' });
  sendSuccess(res, { token }, 'Admin login successful');
}));

// ─── GET /api/admin/matches ───────────────────────────────────────────────────
router.get('/matches', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1')));
  const limit = Math.min(50, parseInt(String(req.query.limit ?? '50')));
  const skip  = (page - 1) * limit;

  const [matches, total] = await Promise.all([
    Match.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(),
  ]);
  sendPaginated(res, matches, total, page, limit, 'Admin matches fetched');
}));

// ─── POST /api/admin/matches — create match manually ─────────────────────────
router.post('/matches', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const { team1Name, team1Short, team2Name, team2Short, date, venue, city, format, seriesName, questions } =
    req.body as Record<string, string> & { questions?: { question: string; options: string[] }[] };

  if (!team1Name || !team2Name || !date || !venue) {
    throw new AppError('team1Name, team2Name, date and venue are required', 400);
  }

  // Validate & sanitize questions (max 4)
  const sanitizedQuestions = Array.isArray(questions)
    ? questions.slice(0, 4).filter(q => q.question?.trim()).map(q => ({
        question:      q.question.trim(),
        options:       (q.options ?? []).filter((o: string) => o?.trim()).map((o: string) => o.trim()),
        correctAnswer: '',
      }))
    : [];

  const match = await Match.create({
    teams: [
      { name: team1Name.trim(), shortName: (team1Short || team1Name.slice(0, 3)).toUpperCase().trim(), flagUrl: '' },
      { name: team2Name.trim(), shortName: (team2Short || team2Name.slice(0, 3)).toUpperCase().trim(), flagUrl: '' },
    ],
    date:       new Date(date),
    venue:      venue.trim(),
    city:       (city || venue).trim(),
    format:     (format || 'T20').toUpperCase(),
    status:     'upcoming',
    seriesName: (seriesName || '').trim(),
    questions:  sanitizedQuestions,
    isAdded:    true,
  });

  sendSuccess(res, match, 'Match created successfully', 201);
}));

// ─── GET /api/admin/seed — seed mock matches ──────────────────────────────────
router.get('/seed', adminGuard, asyncHandler(async (_req: Request, res: Response) => {
  const { default: matchSyncService } = await import('../services/matchSyncService');
  const count = await matchSyncService.seedMockMatches();
  sendSuccess(res, { seeded: count }, `${count} mock matches seeded`);
}));

// ─── PUT /api/admin/matches/:id/result ───────────────────────────────────────
router.put('/matches/:id/result', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const { tossWinner, matchWinner, topRunScorer, totalRunsByWinner, playerOfTheMatch, questionAnswers } = req.body;

  const matchDoc = await Match.findById(req.params.id);
  if (!matchDoc) throw new AppError('Match not found', 404);

  if (Array.isArray(questionAnswers)) {
    matchDoc.questions.forEach((q, i) => {
      q.correctAnswer = questionAnswers[i] || '';
    });
  }

  matchDoc.status = 'completed';
  if (tossWinner) {
    matchDoc.result = { tossWinner, matchWinner, topRunScorer, totalRunsByWinner: Number(totalRunsByWinner || 0), playerOfTheMatch };
  }
  const match = await matchDoc.save();

  try {
    const { evaluateChallengesForMatch } = await import('../services/resultService');
    const evalResult = await evaluateChallengesForMatch(String(match._id));
    sendSuccess(res, { match, evaluation: evalResult }, `Result saved. ${evalResult.predictionsEvaluated} predictions evaluated.`);
  } catch {
    sendSuccess(res, match, 'Match result saved.');
  }
}));

// ─── PUT /api/admin/matches/:id/questions — edit match questions ────────────
router.put('/matches/:id/questions', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const { questions } = req.body as { questions?: { question: string; options: string[] }[] };

  const matchDoc = await Match.findById(req.params.id);
  if (!matchDoc) throw new AppError('Match not found', 404);

  // Validate & sanitize questions (max 4)
  const sanitizedQuestions = Array.isArray(questions)
    ? questions.slice(0, 4).filter(q => q.question?.trim()).map(q => ({
        question:      q.question.trim(),
        options:       (q.options ?? []).filter((o: string) => o?.trim()).map((o: string) => o.trim()),
        correctAnswer: '',
      }))
    : [];

  matchDoc.questions = sanitizedQuestions as any;
  await matchDoc.save();

  sendSuccess(res, matchDoc, 'Questions updated successfully');
}));

// ─── DELETE /api/admin/matches/:id ───────────────────────────────────────────
router.delete('/matches/:id', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) throw new AppError('Match not found', 404);
  sendSuccess(res, { id: req.params.id }, 'Match deleted');
}));

// ─── GET /api/admin/challenges ────────────────────────────────────────────────
router.get('/challenges', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1')));
  const limit = Math.min(50, parseInt(String(req.query.limit ?? '50')));
  const skip  = (page - 1) * limit;

  const [challenges, total] = await Promise.all([
    Challenge.find()
      .populate('matchId', 'teams date status format')
      .populate('creatorId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Challenge.countDocuments(),
  ]);
  sendPaginated(res, challenges, total, page, limit, 'Admin challenges fetched');
}));

// ─── DELETE /api/admin/challenges/:id ────────────────────────────────────────
router.delete('/challenges/:id', adminGuard, asyncHandler(async (req: Request, res: Response) => {
  const ch = await Challenge.findByIdAndDelete(req.params.id);
  if (!ch) throw new AppError('Challenge not found', 404);
  sendSuccess(res, { id: req.params.id }, 'Challenge deleted');
}));

export default router;
