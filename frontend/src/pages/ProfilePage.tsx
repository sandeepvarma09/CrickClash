import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import axios from 'axios';

import { API_BASE_URL } from '@/config/api';

const API = API_BASE_URL;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UserStats {
  totalChallenges: number; wins: number; losses: number;
  winStreak: number; bestStreak: number; accuracy: number;
}
interface UserProfile {
  _id: string; username: string; avatar?: string;
  stats: UserStats; badges: string[]; createdAt: string;
}
interface RecentPrediction {
  _id: string; score: number; submittedAt: string; isEvaluated: boolean;
  challengeId?: {
    challengeId: string; stake: string; status: string;
    matchId?: { teams: [{ shortName: string }, { shortName: string }]; format: string; questions?: any[] };
  };
}

// ─── Badge config ──────────────────────────────────────────────────────────────
const BADGES: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
  perfect_prediction: { emoji: '🎯', label: 'Perfect Prediction', desc: 'All 5 predictions correct',      color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  win_streak_3:       { emoji: '🔥', label: '3-Win Streak',       desc: '3 consecutive challenge wins',   color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  win_streak_5:       { emoji: '⚡', label: '5-Win Streak',       desc: '5 consecutive challenge wins',   color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  win_streak_10:      { emoji: '💎', label: '10-Win Streak',      desc: '10 consecutive challenge wins',  color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  weekly_champion:    { emoji: '👑', label: 'Weekly Champion',    desc: 'Most wins in a week',            color: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300' },
  lone_wolf:          { emoji: '🐺', label: 'Lone Wolf',          desc: 'Only one to pick the winner',   color: 'border-green-500/40 bg-green-500/10 text-green-400' },
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="stat-card opacity-0 card-glass p-5 text-center">
      <p className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
      {sub && <p className="text-orange-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Accuracy ring ─────────────────────────────────────────────────────────────
function AccuracyRing({ value }: { value: number }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f97316" strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-white font-black text-lg leading-none">{value}%</p>
        <p className="text-slate-500 text-[10px]">accuracy</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { username }  = useParams<{ username: string }>();
  const containerRef  = useRef<HTMLDivElement>(null);

  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [recent,   setRecent]   = useState<RecentPrediction[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    axios.get(`${API}/api/users/${username}`)
      .then(r => {
        setProfile(r.data.data?.user    ?? null);
        setRecent(r.data.data?.recentPredictions ?? []);
      })
      .catch(e => setError(e.response?.data?.message ?? 'User not found'))
      .finally(() => setLoading(false));
  }, [username]);

  // Animate in
  useEffect(() => {
    if (loading || !containerRef.current) return;
    gsap.fromTo('.stat-card',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.1 });
    gsap.fromTo('.badge-chip', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, stagger: 0.07, duration: 0.35, ease: 'back.out(1.5)', delay: 0.3 });
    gsap.fromTo('.pred-row',   { opacity: 0, x: -15 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.5 });
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        <div className="h-32 rounded-2xl bg-slate-800/50 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i) => <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
        <div className="h-40 rounded-xl bg-slate-800/50 animate-pulse" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="card-glass border-red-500/30 p-10">
          <p className="text-red-400 font-bold text-lg mb-2">⚠️ {error || 'User not found'}</p>
          <Link to="/" className="btn-primary text-sm px-6 py-2 mt-4">← Home</Link>
        </div>
      </div>
    );
  }

  const { stats, badges } = profile;
  const winRate = stats.totalChallenges > 0 ? Math.round((stats.wins / stats.totalChallenges) * 100) : 0;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* ── Profile header ── */}
      <div className="card-glass p-6 flex items-center gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-700/10 border-2 border-orange-500/30 flex items-center justify-center text-4xl shrink-0">
          {profile.avatar || '🏏'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
            @{profile.username}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Member since {memberSince}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {badges.slice(0, 3).map(b => {
              const cfg = BADGES[b];
              return cfg ? (
                <span key={b} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                  {cfg.emoji} {cfg.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
        {/* Accuracy ring */}
        <AccuracyRing value={stats.accuracy} />
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Challenges"  value={stats.totalChallenges} />
        <StatCard label="Wins"        value={stats.wins} sub={`${winRate}% win rate`} />
        <StatCard label="Best Streak" value={`🔥 ${stats.bestStreak}`} />
        <StatCard label="Accuracy"    value={`${stats.accuracy}%`} />
      </div>

      {/* ── Badges ── */}
      <div className="card-glass p-6">
        <h2 className="text-white font-bold text-sm mb-4">🎖️ Badges</h2>
        {badges.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No badges yet — keep playing!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(BADGES).map(([key, cfg]) => {
              const earned = badges.includes(key);
              return (
                <div key={key} className={`badge-chip opacity-0 flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
                  ${earned ? cfg.color : 'border-slate-700/50 bg-slate-800/20 opacity-40 grayscale'}`}>
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div>
                    <p className={`text-xs font-bold leading-tight ${earned ? '' : 'text-slate-600'}`}>{cfg.label}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{cfg.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Predictions ── */}
      <div className="card-glass p-6">
        <h2 className="text-white font-bold text-sm mb-4">📋 Recent Predictions</h2>
        {recent.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm">No predictions yet</p>
            <Link to="/matches" className="btn-primary text-xs px-4 py-2 mt-3 inline-block">Create First Challenge</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(pred => {
              const ch    = pred.challengeId;
              const match = ch?.matchId;
              return (
                <div key={pred._id} className="pred-row opacity-0 flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  {/* Score badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0
                  ${!pred.isEvaluated ? 'bg-slate-700/50 text-slate-400' :
                    (pred.score / (match?.questions?.length || 5)) > 0.6 ? 'bg-green-500/20 text-green-400' :
                    (pred.score / (match?.questions?.length || 5)) > 0.3 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                  {pred.isEvaluated ? `${pred.score}/${match?.questions?.length || 5}` : '?'}
                </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">
                      {match ? `${match.teams[0].shortName} vs ${match.teams[1].shortName}` : `Challenge #${ch?.challengeId ?? '?'}`}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {match?.format} · {new Date(pred.submittedAt).toLocaleDateString('en-IN')}
                      {ch && <span> · 🎯 {ch.stake.slice(0, 25)}{ch.stake.length > 25 ? '…' : ''}</span>}
                    </p>
                  </div>
                  {ch && (
                    <Link to={`/challenge/${ch.challengeId}`}
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors shrink-0">
                      View →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Link to="/matches"     className="btn-primary flex-1 py-3 text-sm text-center">⚡ New Challenge</Link>
        <Link to="/leaderboard" className="btn-ghost  flex-1 py-3 text-sm text-center">🏆 Leaderboard</Link>
      </div>
    </div>
  );
}
