import { Router } from 'express';
import { submitPrediction, getUserPrediction } from '../controllers/predictionController';

const router = Router();

// POST /api/predictions   — submit predictions for a challenge
router.post('/', submitPrediction);

// GET  /api/predictions/:challengeId/:userId  — get a user's prediction
router.get('/:challengeId/:userId', getUserPrediction);

export default router;
