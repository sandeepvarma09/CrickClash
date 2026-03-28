"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictionController_1 = require("../controllers/predictionController");
const router = (0, express_1.Router)();
// POST /api/predictions   — submit predictions for a challenge
router.post('/', predictionController_1.submitPrediction);
// GET  /api/predictions/:challengeId/:userId  — get a user's prediction
router.get('/:challengeId/:userId', predictionController_1.getUserPrediction);
exports.default = router;
