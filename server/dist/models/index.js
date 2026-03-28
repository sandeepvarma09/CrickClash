"use strict";
// ─── Central Model Exports ─────────────────────────────────────────────────────
// Import from here across all controllers to avoid repeated imports
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leaderboard = exports.Prediction = exports.Challenge = exports.Match = exports.User = void 0;
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(User_1).default; } });
var Match_1 = require("./Match");
Object.defineProperty(exports, "Match", { enumerable: true, get: function () { return __importDefault(Match_1).default; } });
var Challenge_1 = require("./Challenge");
Object.defineProperty(exports, "Challenge", { enumerable: true, get: function () { return __importDefault(Challenge_1).default; } });
var Prediction_1 = require("./Prediction");
Object.defineProperty(exports, "Prediction", { enumerable: true, get: function () { return __importDefault(Prediction_1).default; } });
var Leaderboard_1 = require("./Leaderboard");
Object.defineProperty(exports, "Leaderboard", { enumerable: true, get: function () { return __importDefault(Leaderboard_1).default; } });
