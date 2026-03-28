import { Router } from 'express';
import {
  createChallenge,
  getChallengeById,
  getChallengePredictions,
  getChallengeResults,
  getChallengeLeaderboard,
} from '../controllers/challengeController';

const router = Router();

// POST /api/challenges
router.post('/', createChallenge);

// GET  /api/challenges/:id
router.get('/:id', getChallengeById);

// GET  /api/challenges/:id/predictions
router.get('/:id/predictions', getChallengePredictions);

// GET  /api/challenges/:id/results
router.get('/:id/results', getChallengeResults);

// GET  /api/challenges/:id/leaderboard
router.get('/:id/leaderboard', getChallengeLeaderboard);

export default router;
