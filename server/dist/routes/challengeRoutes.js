"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const challengeController_1 = require("../controllers/challengeController");
const router = (0, express_1.Router)();
// POST /api/challenges
router.post('/', challengeController_1.createChallenge);
// GET  /api/challenges/:id
router.get('/:id', challengeController_1.getChallengeById);
// GET  /api/challenges/:id/predictions
router.get('/:id/predictions', challengeController_1.getChallengePredictions);
// GET  /api/challenges/:id/results
router.get('/:id/results', challengeController_1.getChallengeResults);
// GET  /api/challenges/:id/leaderboard
router.get('/:id/leaderboard', challengeController_1.getChallengeLeaderboard);
exports.default = router;
