// ─── Match Types ───────────────────────────────────────────────────────────────
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type MatchFormat = 'IPL' | 'T20' | 'ODI' | 'TEST';

export interface Team {
  name: string;
  shortName: string;
  flagUrl?: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer?: string;
}

export interface Match {
  _id: string;
  matchId: string;
  teams: [Team, Team];
  date: string;
  venue: string;
  format: MatchFormat;
  status: MatchStatus;
  result?: MatchResult;
  questions?: Question[];   // admin-defined prediction questions
  externalId?: string;      // CricAPI match ID
}

export interface MatchResult {
  tossWinner: string;
  matchWinner: string;
  topRunScorer: string;
  totalRunsByWinner: number;
  playerOfTheMatch: string;
}

// ─── Challenge Types ────────────────────────────────────────────────────────────
export type ChallengeStatus = 'open' | 'locked' | 'completed';

export interface Challenge {
  _id: string;
  challengeId: string; // short ID e.g. "abc123"
  matchId: string;
  match?: Match;
  creatorId: string;
  creator?: User;
  stake: string;
  participants: Participant[];
  status: ChallengeStatus;
  createdAt: string;
}

export interface Participant {
  userId: string;
  user?: User;
  joinedAt: string;
}

// ─── Prediction Types ───────────────────────────────────────────────────────────
export interface PredictionAnswers {
  tossWinner: string;
  matchWinner: string;
  topRunScorer: string;
  totalRunsByWinner: number;
  playerOfTheMatch: string;
}

export interface Prediction {
  _id: string;
  challengeId: string;
  userId: string;
  user?: User;
  answers: PredictionAnswers;
  score?: number;
  submittedAt: string;
  results?: PredictionResults;
}

export interface PredictionResults {
  tossWinner: boolean;
  matchWinner: boolean;
  topRunScorer: boolean;
  totalRunsByWinner: boolean;
  playerOfTheMatch: boolean;
  totalCorrect: number;
}

// ─── User Types ─────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  avatar?: string;
  stats: UserStats;
  badges: BadgeType[];
  createdAt: string;
}

export interface UserStats {
  totalChallenges: number;
  wins: number;
  losses: number;
  winStreak: number;
  accuracy: number; // percentage
}

export type BadgeType =
  | 'perfect_prediction'
  | 'win_streak_3'
  | 'win_streak_5'
  | 'win_streak_10'
  | 'weekly_champion'
  | 'lone_wolf';

// ─── Leaderboard Types ──────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user?: User;
  correctPredictions: number;
  totalPredictions: number;
  isWinner: boolean;
  isPunished: boolean;
}

export interface Leaderboard {
  _id: string;
  challengeId: string;
  challenge?: Challenge;
  rankings: LeaderboardEntry[];
  winner?: User;
  loser?: User;
  stake: string;
  computedAt: string;
}

// ─── API Response Types ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
