import { Router } from 'express';
import {
  getMatches,
  getUpcomingMatches,
  getMatchById,
  syncMatches,
  seedMatches,
  searchPlayers,
  createMatch,
  updateMatchResult,
  deleteMatch,
} from '../controllers/matchController';
import { protect, adminOnly } from '../middleware/auth';
import { AuthRequest }        from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

/** GET /api/matches?status=upcoming,live&format=T20&page=1&limit=20 */
router.get('/', getMatches);

/** GET /api/matches/upcoming */
router.get('/upcoming', getUpcomingMatches);

/** GET /api/matches/sync — trigger API sync */
router.get('/sync', syncMatches);

/** GET /api/matches/seed — seed mock data (dev only) */
router.get('/seed', seedMatches);

/** GET /api/matches/players/search?name=Kohli */
router.get('/players/search', searchPlayers);

/** GET /api/matches/:id */
router.get('/:id', getMatchById);

// ─── Admin-Only Routes ────────────────────────────────────────────────────────

/** POST /api/matches — create match manually */
router.post(
  '/',
  (req: AuthRequest, res: Response, next: NextFunction) => protect(req, res, next),
  (req: AuthRequest, res: Response, next: NextFunction) => adminOnly(req, res, next),
  createMatch
);

/** PUT /api/matches/:id/result — update match result */
router.put(
  '/:id/result',
  (req: AuthRequest, res: Response, next: NextFunction) => protect(req, res, next),
  (req: AuthRequest, res: Response, next: NextFunction) => adminOnly(req, res, next),
  updateMatchResult
);

/** DELETE /api/matches/:id */
router.delete(
  '/:id',
  (req: AuthRequest, res: Response, next: NextFunction) => protect(req, res, next),
  (req: AuthRequest, res: Response, next: NextFunction) => adminOnly(req, res, next),
  deleteMatch
);

export default router;
