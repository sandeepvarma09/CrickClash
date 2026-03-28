import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface UserEntry {
  _id: string;
  username: string;
  avatar?: string;
  stats: { wins: number; totalChallenges: number; accuracy: number; winStreak: number };
  badges: string[];
}

const MEDAL = ['🥇', '🥈', '🥉'];
const BADGE_LABELS: Record<string, string> = {
  perfect_prediction: '🎯 Perfect',
  win_streak_3:       '🔥 3-Streak',
  win_streak_5:       '⚡ 5-Streak',
  win_streak_10:      '💎 10-Streak',
  weekly_champion:    '👑 Weekly',
  lone_wolf:          '🐺 Lone Wolf',
};

// ─── Podium (top 3) ────────────────────────────────────────────────────────────
function Podium({ top3 }: { top3: UserEntry[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean); // 2nd, 1st, 3rd
  const heights = ['h-20 sm:h-24', 'h-28 sm:h-32', 'h-16 sm:h-20'];
  const ranks   = [2, 1, 3];

  return (
    <div className="podium-wrap flex items-end justify-center gap-2 sm:gap-4 mb-10 opacity-0 px-2 sm:px-0">
      {order.map((user, i) => (
        <div key={user._id} className="flex flex-col items-center gap-1.5 sm:gap-2">
          {/* Avatar */}
          <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 
            ${ranks[i] === 1 ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/20' :
              ranks[i] === 2 ? 'border-slate-400 bg-slate-500/10' : 'border-amber-700 bg-amber-700/10'}`}>
            🏏
            <span className="absolute -top-1 -right-1 text-xs sm:text-sm">{MEDAL[ranks[i] - 1]}</span>
          </div>
          <div className="text-center truncate w-max max-w-[70px] sm:max-w-[100px]">
             <p className="text-white font-black text-[10px] sm:text-xs">@{user.username}</p>
             <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase">{user.stats.wins} Wins</p>
          </div>
          {/* Podium block */}
          <div className={`w-16 sm:w-24 ${heights[i]} rounded-t-2xl flex items-center justify-center font-black text-xl sm:text-3xl
            ${ranks[i] === 1 ? 'bg-gradient-to-t from-yellow-600/40 to-yellow-400/20 border-x border-t border-yellow-500/30' :
              ranks[i] === 2 ? 'bg-gradient-to-t from-slate-600/40 to-slate-500/20 border-x border-t border-slate-500/30' :
              'bg-gradient-to-t from-amber-800/40 to-amber-700/20 border-x border-t border-amber-700/30'}`}>
            {ranks[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ user, rank }: { user: UserEntry; rank: number }) {
  const winRate = user.stats.totalChallenges > 0
    ? Math.round((user.stats.wins / user.stats.totalChallenges) * 100)
    : 0;

  return (
    <div className="lb-row opacity-0 flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:border-orange-500/30 transition-all duration-200">
      <span className="text-slate-500 font-bold w-6 text-center text-sm shrink-0">
        {rank <= 3 ? MEDAL[rank - 1] : rank}
      </span>
      <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-lg border border-slate-600 shrink-0">
        🏏
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">@{user.username}</p>
        <div className="flex gap-2 flex-wrap mt-0.5">
          {user.badges.slice(0, 2).map(b => (
            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {BADGE_LABELS[b] ?? b}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-bold text-sm">{user.stats.wins}W</p>
        <p className="text-slate-500 text-xs">{winRate}% win rate</p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-orange-400 font-semibold text-sm">🔥 {user.stats.winStreak}</p>
        <p className="text-slate-500 text-xs">streak</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [tab, setTab]       = useState<'global' | 'weekly'>('global');
  const [users, setUsers]   = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true); setError('');
    axios.get(`${API}/leaderboard/${tab}`)
      .then(r => setUsers(r.data.data ?? []))
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [tab]);

  // Animate rows in
  useEffect(() => {
    if (loading || !containerRef.current) return;
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo('.podium-wrap', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)' });
    tl.fromTo('.lb-row', { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out' }, '-=0.3');
  }, [loading, users]);

  const top3 = users.slice(0, 3);
  const rest  = users.slice(3);

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="section-title mb-1">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm">See who's dominating the predictions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        {(['global', 'weekly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} id={`lb-tab-${t}`}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 capitalize
              ${tab === t ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
            {t === 'global' ? '🌍 All Time' : '📅 This Week'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card-glass border-red-500/30 p-8 text-center">
          <p className="text-red-400 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && users.length === 0 && (
        <div className="card-glass p-12 text-center">
          <p className="text-4xl mb-3">🏏</p>
          <p className="text-white font-bold mb-1">No players yet</p>
          <p className="text-slate-400 text-sm mb-5">Be the first to create a challenge!</p>
          <Link to="/matches" className="btn-primary text-sm px-6 py-2">Browse Matches</Link>
        </div>
      )}

      {/* Podium */}
      {!loading && !error && top3.length >= 2 && <Podium top3={top3} />}

      {/* Full list */}
      {!loading && !error && users.length > 0 && (
        <div className="space-y-3">
          {users.map((u, i) => (
            <LeaderRow key={u._id} user={u} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
