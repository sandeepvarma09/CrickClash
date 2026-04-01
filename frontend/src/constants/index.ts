// ─── App Constants ──────────────────────────────────────────────────────────────

export const APP_NAME = 'Cricket Clash';
export const APP_TAGLINE = 'Predictions Decide Pride';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Prediction Questions ────────────────────────────────────────────────────────
export const PREDICTION_QUESTIONS = [
  {
    key: 'tossWinner',
    label: 'Toss Winner',
    emoji: '🪙',
    type: 'team',
  },
  {
    key: 'matchWinner',
    label: 'Match Winner',
    emoji: '🏆',
    type: 'team',
  },
  {
    key: 'topRunScorer',
    label: 'Top Run Scorer',
    emoji: '🏏',
    type: 'player',
  },
  {
    key: 'totalRunsByWinner',
    label: 'Total Runs by Winning Team',
    emoji: '🔢',
    type: 'number',
  },
  {
    key: 'playerOfTheMatch',
    label: 'Player of the Match',
    emoji: '⭐',
    type: 'player',
  },
] as const;

// ─── Default Stake Options ───────────────────────────────────────────────────────
export const DEFAULT_STAKES = [
  '🍗 Buy biryani for the winner',
  '👕 Wear the opponent\'s team jersey',
  '📸 Post a defeat story on Instagram',
  '💃 Dance at the next party',
  '☕ Buy the winner a coffee',
  '🎮 Loser does the winner\'s chores for a day',
  '🎶 Sing a song in front of everyone',
  '🤐 No social media for 24 hours',
] as const;

// ─── Badge Config ─────────────────────────────────────────────────────────────────
export const BADGE_CONFIG = {
  perfect_prediction: { label: 'Perfect Predictor', emoji: '🎯', description: 'All 5 predictions correct' },
  win_streak_3: { label: 'Hat-trick', emoji: '🔥', description: '3 wins in a row' },
  win_streak_5: { label: 'On Fire', emoji: '💥', description: '5 wins in a row' },
  win_streak_10: { label: 'Legend', emoji: '👑', description: '10 wins in a row' },
  weekly_champion: { label: 'Weekly Champion', emoji: '🏅', description: 'Most wins in a week' },
  lone_wolf: { label: 'Lone Wolf', emoji: '🐺', description: 'Only one who picked the correct team' },
} as const;

// ─── Match Format Labels ──────────────────────────────────────────────────────────
export const FORMAT_LABELS = {
  T20: 'T20',
  ODI: 'One Day International',
  Test: 'Test Match',
  T10: 'T10',
} as const;

// ─── Social Share URLs ───────────────────────────────────────────────────────────
export const getWhatsAppShareUrl = (text: string, url: string) =>
  `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;

export const getTwitterShareUrl = (text: string, url: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

export const getTelegramShareUrl = (text: string, url: string) =>
  `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
