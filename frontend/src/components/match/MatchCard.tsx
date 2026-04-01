import { Link } from 'react-router-dom';
import type { Match } from '@/types';

// ─── Format badge colours ──────────────────────────────────────────────────────
const FORMAT_STYLES: Record<string, string> = {
  T20:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ODI:  'bg-blue-500/20   text-blue-400   border-blue-500/30',
  Test: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  T10:  'bg-pink-500/20   text-pink-400   border-pink-500/30',
};

const STATUS_DOT: Record<string, string> = {
  upcoming:  'bg-slate-500',
  live:      'bg-green-400 animate-pulse',
  completed: 'bg-red-500',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const [t1, t2] = match.teams;
  const formatStyle = FORMAT_STYLES[match.format] ?? FORMAT_STYLES['T20'];
  const dotStyle    = STATUS_DOT[match.status]   ?? 'bg-slate-500';

  return (
    <article
      id={`match-card-${match._id}`}
      className="card-glass p-5 flex flex-col gap-4 hover:border-orange-500/40 transition-all duration-300 group"
    >
      {/* ── Top Row: format + status ── */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${formatStyle}`}>
          {match.format}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 capitalize">
          <span className={`w-2 h-2 rounded-full ${dotStyle}`} />
          {match.status}
        </span>
      </div>

      {/* ── Teams ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Team 1 */}
        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center text-2xl mb-2 border border-slate-600 group-hover:border-orange-500/30 transition-colors">
            🏏
          </div>
          <p className="text-white font-bold text-sm leading-tight">{t1.shortName}</p>
          <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[90px] mx-auto">{t1.name}</p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-gradient font-black text-xl" style={{ fontFamily: 'var(--font-display)' }}>VS</span>
          {match.status === 'live' && (
            <span className="text-green-400 text-[10px] font-semibold tracking-wider animate-pulse">LIVE</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center text-2xl mb-2 border border-slate-600 group-hover:border-orange-500/30 transition-colors">
            🏏
          </div>
          <p className="text-white font-bold text-sm leading-tight">{t2.shortName}</p>
          <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[90px] mx-auto">{t2.name}</p>
        </div>
      </div>

      {/* ── Venue + Date ── */}
      <div className="border-t border-slate-700/50 pt-3 space-y-1">
        <p className="text-slate-400 text-xs flex items-center gap-1.5">
          <span>📍</span>
          <span className="truncate">{match.venue}</span>
        </p>
        <p className="text-slate-400 text-xs flex items-center gap-1.5">
          <span>📅</span>
          <span>{formatDate(match.date)}</span>
          <span className="text-slate-600">•</span>
          <span>{formatTime(match.date)} IST</span>
        </p>
      </div>

      {/* ── CTA ── */}
      {match.status !== 'completed' ? (
        <Link
          to={`/challenge/create/${match._id}`}
          id={`create-challenge-${match._id}`}
          className="btn-primary text-sm py-2.5 text-center w-full mt-auto"
        >
          ⚡ Create Challenge
        </Link>
      ) : (
        <div className="text-center text-xs text-slate-500 py-2 border border-slate-700/50 rounded-lg">
          Match completed
        </div>
      )}
    </article>
  );
}
