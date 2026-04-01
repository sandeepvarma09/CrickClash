import { Router } from 'express';
import { getGlobalLeaderboard } from '../services/resultService';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess }  from '../utils/response';
import User from '../models/User';

const router = Router();

// GET /api/leaderboard/global  — all-time top players
router.get('/global', asyncHandler(async (_req, res) => {
  const users = await getGlobalLeaderboard(20);
  sendSuccess(res, users, 'Global leaderboard fetched');
}));

// GET /api/leaderboard/weekly  — top players in last 7 days (by recent challenge wins)
router.get('/weekly', asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await User.find({
    'stats.totalChallenges': { $gt: 0 },
    isAdmin: { $ne: true },
    updatedAt: { $gte: since },
  })
    .sort({ 'stats.wins': -1, 'stats.accuracy': -1 })
    .limit(20)
    .select('username avatar stats badges')
    .lean();
  sendSuccess(res, users, 'Weekly leaderboard fetched');
}));

export default router;
