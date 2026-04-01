import { useState } from 'react';
import { useMatches }        from '@/hooks/useMatches';
import { useSEO }            from '@/hooks/useSEO';
import MatchCard             from '@/components/match/MatchCard';
import MatchCardSkeleton     from '@/components/match/MatchCardSkeleton';
import type { MatchFormat }  from '@/types';

type FilterFormat = MatchFormat | 'ALL';

const FORMATS: FilterFormat[] = ['ALL', 'IPL', 'T20', 'ODI', 'TEST'];

export default function MatchesPage() {
  useSEO({ title: 'Upcoming Matches', description: 'Browse upcoming cricket matches and create prediction challenges with your friends.' });
  const [formatFilter, setFormatFilter] = useState<FilterFormat>('ALL');

  const { matches, loading, error, refetch } = useMatches({
    status: 'upcoming,live',
    format: formatFilter === 'ALL' ? undefined : formatFilter,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="section-title mb-1">Upcoming Matches</h1>
        <p className="text-slate-400">Select a match to create your prediction challenge</p>
      </div>

      {/* ── Format Filter Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FORMATS.map((fmt) => (
          <button
            key={fmt}
            id={`filter-${fmt.toLowerCase()}`}
            onClick={() => setFormatFilter(fmt)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              formatFilter === fmt
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {fmt}
          </button>
        ))}

        <button
          id="refresh-matches"
          onClick={refetch}
          className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium border border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-orange-400 transition-all duration-200"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="card-glass border-red-500/30 p-6 text-center mb-8">
          <p className="text-red-400 font-semibold mb-1">⚠️ Could not load matches</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={refetch} className="btn-primary text-sm px-6 py-2">
            Try Again
          </button>
        </div>
      )}

      {/* ── Loading Skeletons ── */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Match Grid ── */}
      {!loading && !error && matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && matches.length === 0 && (
        <div className="card-glass p-14 text-center">
          <p className="text-4xl mb-4">🏏</p>
          <p className="text-white font-bold text-lg mb-1">No matches found</p>
          <p className="text-slate-400 text-sm mb-6">
            {formatFilter !== 'ALL'
              ? `No ${formatFilter} matches scheduled right now.`
              : 'No upcoming matches at the moment.'}
          </p>
          {formatFilter !== 'ALL' && (
            <button onClick={() => setFormatFilter('ALL')} className="btn-primary text-sm px-6 py-2">
              Show all formats
            </button>
          )}
        </div>
      )}
    </div>
  );
}
