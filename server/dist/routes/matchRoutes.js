"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── Public Routes ────────────────────────────────────────────────────────────
/** GET /api/matches?status=upcoming,live&format=T20&page=1&limit=20 */
router.get('/', matchController_1.getMatches);
/** GET /api/matches/upcoming */
router.get('/upcoming', matchController_1.getUpcomingMatches);
/** GET /api/matches/sync — trigger API sync */
router.get('/sync', matchController_1.syncMatches);
/** GET /api/matches/seed — seed mock data (dev only) */
router.get('/seed', matchController_1.seedMatches);
/** GET /api/matches/players/search?name=Kohli */
router.get('/players/search', matchController_1.searchPlayers);
/** GET /api/matches/:id */
router.get('/:id', matchController_1.getMatchById);
// ─── Admin-Only Routes ────────────────────────────────────────────────────────
/** POST /api/matches — create match manually */
router.post('/', (req, res, next) => (0, auth_1.protect)(req, res, next), (req, res, next) => (0, auth_1.adminOnly)(req, res, next), matchController_1.createMatch);
/** PUT /api/matches/:id/result — update match result */
router.put('/:id/result', (req, res, next) => (0, auth_1.protect)(req, res, next), (req, res, next) => (0, auth_1.adminOnly)(req, res, next), matchController_1.updateMatchResult);
/** DELETE /api/matches/:id */
router.delete('/:id', (req, res, next) => (0, auth_1.protect)(req, res, next), (req, res, next) => (0, auth_1.adminOnly)(req, res, next), matchController_1.deleteMatch);
exports.default = router;
