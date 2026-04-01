// ─── Central Model Exports ─────────────────────────────────────────────────────
// Import from here across all controllers to avoid repeated imports

export { default as User }        from './User';
export { default as Match }       from './Match';
export { default as Challenge }   from './Challenge';
export { default as Prediction }  from './Prediction';
export { default as Leaderboard } from './Leaderboard';

// ─── Type Exports ──────────────────────────────────────────────────────────────
export type { IUser, IUserStats, BadgeType }               from './User';
export type { IMatch, IMatchResult, ITeam, MatchStatus, MatchFormat } from './Match';
export type { IChallenge, IParticipant, ChallengeStatus }  from './Challenge';
export type { IPrediction, IPredictionAnswers, IPredictionResults } from './Prediction';
export type { ILeaderboard, ILeaderboardEntry }            from './Leaderboard';
