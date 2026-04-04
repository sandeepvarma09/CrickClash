import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

import { API_BASE_URL } from '@/config/api';

const API = API_BASE_URL;

interface Prediction {
  _id: string;
  score: number;
  submittedAt: string;
  isEvaluated: boolean;
  challengeId?: {
    challengeId: string;
    stake: string;
    status: string;
    matchId?: { 
      teams: [{ shortName: string }, { shortName: string }]; 
      format: string; 
      status: string;
      date?: string;
      questions?: any[];
    };
  };
}

export default function MyChallengesPage() {
  const { user, isAuthenticated } = useAuth();
  const username = user?.username || localStorage.getItem('cricclash_username') || '';
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) { setLoading(false); return; }
    axios.get(`${API}/api/users/${username}/predictions`)
      .then(r => {
        const data = r.data.data ?? [];
        // Filter out predictions with missing/null challengeId (deleted challenges)
        // Keep challenges even if they don't have a matchId yet (safety)
        const valid = data.filter((p: Prediction) => p.challengeId);
        setPredictions(valid);

      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.challenge-card', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [loading]);

  if (!username) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-slate-400 mb-6">Please log in to see your challenges and battle history.</p>
        <Link to="/matches" className="btn-primary px-6 py-2">Go to Matches</Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <div className="mb-6 sm:mb-10 text-center sm:text-left">
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          My <span className="text-gradient">Challenges</span>
        </h1>
        <p className="text-slate-400 text-sm">Track all your predictions and results in one place.</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 sm:h-32 bg-slate-800/50 rounded-2xl sm:rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-14 sm:py-20 card-glass">
          <p className="text-4xl mb-4">🏏</p>
          <h2 className="text-xl font-bold text-white mb-2">No Challenges Yet</h2>
          <p className="text-slate-400 mb-6 text-sm px-4">You haven't made any predictions yet. Create or join a challenge now!</p>
          <Link to="/matches" className="btn-primary px-8 py-3 rounded-2xl">Browse Matches</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {predictions.map(pred => {
            const ch = pred.challengeId;
            const match = ch?.matchId;
            const status = ch?.status || 'pending';
            const matchDate = match?.date ? new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
            
            return (
              <div key={pred._id} className="challenge-card opacity-0 group card-glass p-1 overflow-hidden transition-all duration-300 hover:border-orange-500/30">
                <div className="p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                  {/* Status Badge */}
                  <div className="flex sm:flex-col items-center gap-3 sm:gap-0 w-full sm:w-auto">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center font-black border-2 shrink-0
                      ${status === 'completed' 
                        ? 'border-green-500/30 bg-green-500/10 text-green-400' 
                        : status === 'live' 
                        ? 'border-red-500/30 bg-red-500/10 text-red-500 animate-pulse'
                        : 'border-slate-700/50 bg-slate-800/50 text-slate-400'}`}>
                      <span className="text-lg leading-tight">
                        {pred.isEvaluated ? `${pred.score}` : '?'}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest block opacity-60">Score</span>
                    </div>
                    {/* Mobile-only: team names + match info inline */}
                    <div className="flex-1 sm:hidden min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter
                          ${status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-slate-700 text-slate-500'}`}>
                          {status}
                        </span>
                        <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">#{ch?.challengeId || '0000'}</span>
                      </div>
                      <h3 className="text-base font-black text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {match?.teams?.[0]?.shortName || '?'} vs {match?.teams?.[1]?.shortName || '?'}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        {match?.format} · {matchDate}
                      </p>
                    </div>
                    {/* Mobile-only: view button */}
                    <Link to={`/challenge/${ch?.challengeId}`} className="sm:hidden shrink-0 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all active:scale-95">
                      View
                    </Link>
                  </div>

                  {/* Desktop: Match info */}
                  <div className="hidden sm:block flex-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter
                        ${status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-slate-700 text-slate-500'}`}>
                        {status}
                      </span>
                      <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">#{ch?.challengeId || '0000'}</span>
                    </div>
                    <h3 className="text-xl font-black text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                      {match?.teams?.[0]?.shortName || '?'} vs {match?.teams?.[1]?.shortName || '?'}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {match?.format} · {matchDate}
                    </p>
                  </div>

                  {/* Desktop: Stake + View button */}
                  <div className="hidden sm:flex shrink-0 flex-col items-center sm:items-end gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center sm:text-right">Stake</p>
                      <p className="text-orange-400 font-bold text-sm max-w-[150px] truncate">{ch?.stake || 'No Stake'}</p>
                    </div>
                    <Link to={`/challenge/${ch?.challengeId}`} 
                      className="px-6 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all active:scale-95">
                      View Challenge
                    </Link>
                  </div>

                  {/* Mobile: Stake bar */}
                  <div className="sm:hidden w-full flex items-center justify-between px-1 pt-1 border-t border-slate-800/50">
                    <p className="text-orange-400 font-bold text-xs truncate max-w-[65%]">🎯 {ch?.stake || 'No Stake'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
