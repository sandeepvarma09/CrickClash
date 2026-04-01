import { Request, Response } from 'express';
import Match from '../models/Match';
import matchSyncService from '../services/matchSyncService';
import cricketApiService from '../services/cricketApiService';
import { evaluateChallengesForMatch } from '../services/resultService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function qs(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return val.length > 0 ? String(val[0]) : fallback;
  if (typeof val === 'object') return fallback;
  return String(val);
}

// ─── GET /api/matches ─────────────────────────────────────────────────────────
export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  const status = qs(req.query.status, 'upcoming,live');
  const format = qs(req.query.format);
  const page   = Math.max(1, parseInt(qs(req.query.page, '1')));
  const limit  = Math.min(parseInt(qs(req.query.limit, '20')), 50);
  const skip   = (page - 1) * limit;

  const statusFilter = status.split(',').map((s) => s.trim());
  const query: Record<string, unknown> = { status: { $in: statusFilter } };
  if (format) query.format = format.toUpperCase();

  const count = await Match.countDocuments(query);
  // Auto-sync disabled per user request: only show admin-created matches

  const [matches, total] = await Promise.all([
    Match.find(query).sort({ date: 1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(query),
  ]);

  sendPaginated(res, matches, total, page, limit, 'Matches fetched successfully');
});

// ─── GET /api/matches/upcoming ────────────────────────────────────────────────
export const getUpcomingMatches = asyncHandler(async (_req: Request, res: Response) => {
  const matches = await matchSyncService.getUpcomingMatches(20);
  sendSuccess(res, matches, `${matches.length} upcoming matches found`);
});

// ─── GET /api/matches/:id ─────────────────────────────────────────────────────
export const getMatchById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const isObjectId = /^[a-f\d]{24}$/i.test(id);

  const match = await Match.findOne({
    $or: [...(isObjectId ? [{ _id: id }] : []), { externalId: id }],
  }).lean();

  if (!match) throw new AppError('Match not found', 404);
  sendSuccess(res, match, 'Match fetched successfully');
});

// ─── GET /api/matches/sync ────────────────────────────────────────────────────
export const syncMatches = asyncHandler(async (_req: Request, res: Response) => {
  const result = await matchSyncService.syncCurrentMatches();
  sendSuccess(res, result, `Sync complete: ${result.created} created, ${result.updated} updated`);
});

// ─── GET /api/matches/seed (dev only) ────────────────────────────────────────
export const seedMatches = asyncHandler(async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') throw new AppError('Not allowed in production', 403);
  const count = await matchSyncService.seedMockMatches();
  sendSuccess(res, { seeded: count }, `${count} mock matches seeded`);
});

// ─── GET /api/matches/players/search?name=Kohli ───────────────────────────────
export const searchPlayers = asyncHandler(async (req: Request, res: Response) => {
  const name = qs(req.query.name).trim();
  if (name.length < 2) throw new AppError('Search query must be at least 2 characters', 400);
  const players = await cricketApiService.searchPlayers(name);
  sendSuccess(res, players, `${players.length} players found`);
});

// ─── POST /api/matches (Admin) ────────────────────────────────────────────────
export const createMatch = asyncHandler(async (req: Request, res: Response) => {
  const { team1Name, team1Short, team2Name, team2Short, date, venue, city, format, seriesName } = req.body;

  if (!team1Name || !team2Name || !date || !venue) {
    throw new AppError('team1Name, team2Name, date, and venue are required', 400);
  }

  const match = await Match.create({
    teams: [
      { name: team1Name, shortName: team1Short || team1Name.slice(0, 3).toUpperCase(), flagUrl: '' },
      { name: team2Name, shortName: team2Short || team2Name.slice(0, 3).toUpperCase(), flagUrl: '' },
    ],
    date:       new Date(date),
    venue,
    city:       city || venue,
    format:     format || 'T20',
    status:     'upcoming',
    seriesName: seriesName || '',
    isAdded:    true,
  });

  sendSuccess(res, match, 'Match created successfully', 201);
});

// ─── PUT /api/matches/:id/result (Admin) ─────────────────────────────────────
export const updateMatchResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tossWinner, matchWinner, topRunScorer, totalRunsByWinner, playerOfTheMatch, margin } = req.body;

  if (!tossWinner || !matchWinner || !topRunScorer || totalRunsByWinner === undefined || !playerOfTheMatch) {
    throw new AppError('All 5 result fields are required', 400);
  }

  const match = await Match.findByIdAndUpdate(
    id,
    {
      result: { tossWinner, matchWinner, topRunScorer, totalRunsByWinner: Number(totalRunsByWinner), playerOfTheMatch, margin: margin || '' },
      status: 'completed',
    },
    { new: true, runValidators: true }
  );

  if (!match) throw new AppError('Match not found', 404);

  // ── TASK-13: Trigger auto-evaluation of all predictions for this match ──────
  try {
    const evalResult = await evaluateChallengesForMatch(String(match._id));
    sendSuccess(res, { match, evaluation: evalResult },
      `Match result saved. ${evalResult.predictionsEvaluated} predictions evaluated across ${evalResult.challengesProcessed} challenges.`);
  } catch (evalErr) {
    console.error('Result evaluation error:', evalErr);
    sendSuccess(res, match, 'Match result updated. Prediction evaluation encountered an error.');
  }
});

// ─── DELETE /api/matches/:id (Admin) ─────────────────────────────────────────
export const deleteMatch = asyncHandler(async (req: Request, res: Response) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) throw new AppError('Match not found', 404);
  sendSuccess(res, { id: req.params.id }, 'Match deleted');
});
