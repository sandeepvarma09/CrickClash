import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PredAnswers {
  questionAnswers: string[];
}
interface Participant {
  userId: { username: string; avatar?: string };
  answers: PredAnswers;
  score: number;
  results?: {
    questionResults: boolean[]; totalCorrect: number;
  };
}
interface Question { question: string; options: string[]; correctAnswer?: string }
interface ChallengeInfo { challengeId: string; stake: string; status: string; matchId: { status: string; questions: Question[] } }

// ─── Prediction row (side by side) ────────────────────────────────────────────

function VersusRow({
  label, val1, val2, res1, res2, revealed, correctAnswer
}: {
  label: string;
  val1: string; val2: string;
  res1?: boolean; res2?: boolean;
  revealed: boolean;
  correctAnswer?: string;
}) {
  const cell = (val: string, correct?: boolean) => (
    <div className={`flex-1 text-center py-2.5 px-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-500
      ${revealed && correct !== undefined
        ? correct
          ? 'bg-green-500/20 border-green-500/40 text-green-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
        : 'bg-slate-800/50 border-slate-700/50 text-white'}`}>
      <span className="truncate block max-w-full">{val}</span>
      {revealed && correct !== undefined && (
        <span className="mt-0.5 block text-[10px] sm:inline sm:ml-1.5 opacity-80">{correct ? '✅' : '❌'}</span>
      )}
    </div>
  );

  return (
    <div className="versus-row opacity-0 mb-4 pb-4 border-b border-slate-700/30 last:border-0 last:pb-0 last:mb-0">
      <p className="text-[10px] sm:text-xs text-slate-500 text-center uppercase font-black tracking-widest mb-2 px-4">{label}</p>
      {revealed && correctAnswer && (
         <p className="text-[10px] text-orange-400/80 text-center mb-3 italic">Correct: {correctAnswer}</p>
      )}
      <div className="flex gap-2 sm:gap-3 items-center">
        {cell(val1, revealed ? res1 : undefined)}
        <div className="flex items-center justify-center text-slate-700 text-[10px] font-black shrink-0 w-6 h-6 rounded-full border border-slate-800 bg-slate-900/50">VS</div>
        {cell(val2, revealed ? res2 : undefined)}
      </div>
    </div>
  );
}

// ─── Player card ───────────────────────────────────────────────────────────────
function PlayerCard({ username, score, isWinner, side, totalQuestions }: {
  username: string; score?: number; isWinner?: boolean; side: 'left' | 'right'; totalQuestions?: number;
}) {
  return (
    <div className={`player-card opacity-0 flex flex-col items-center gap-2 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-colors
        ${isWinner ? 'border-orange-400 bg-orange-500/10' : 'border-slate-600 bg-slate-800/50'}`}>
        🏏
      </div>
      <p className="text-white font-bold text-sm">@{username}</p>
      {score !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
          ${isWinner ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700/50 text-slate-400'}`}>
          {score}/{totalQuestions ?? 5} correct
        </span>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function VersusPage() {
  const { id }             = useParams<{ id: string }>();
  const [searchParams]     = useSearchParams();
  const joinerUsername     = searchParams.get('joiner') ?? '';

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [challenge, setChallenge]       = useState<ChallengeInfo | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [revealed, setRevealed]         = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API}/challenges/${id}`),
      axios.get(`${API}/challenges/${id}/predictions`),
    ])
      .then(([cRes, pRes]) => {
        // The cRes.data.data object has challenge with matchId populated
        setChallenge(cRes.data.data?.challenge ?? null);
        setParticipants(pRes.data.data ?? []);
      })
      .catch(e => setError(e.response?.data?.message ?? 'Could not load versus data'))
      .finally(() => setLoading(false));
  }, [id]);

  // Animate in rows after load
  useEffect(() => {
    if (loading || !containerRef.current) return;
    const tl = gsap.timeline({ delay: 0.2 });

    // Player cards fly in from sides
    tl.fromTo('.player-card', { opacity: 0, y: -30 }, {
      opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)',
    });

    // VS badge
    tl.fromTo('.vs-badge', { opacity: 0, scale: 0.5 }, {
      opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)',
    }, '-=0.2');

    // Comparison rows stagger in
    tl.fromTo('.versus-row', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out',
    }, '-=0.1');
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card-glass p-10 animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-slate-700/70" />
              <div className="h-4 w-20 bg-slate-700/50 rounded" />
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-700/70 self-center" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-slate-700/70" />
              <div className="h-4 w-20 bg-slate-700/50 rounded" />
            </div>
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-14 bg-slate-700/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="card-glass border-red-500/30 p-10">
          <p className="text-red-400 font-bold text-lg mb-2">⚠️ {error}</p>
          <Link to="/matches" className="btn-primary text-sm px-6 py-2 mt-4">← Browse Matches</Link>
        </div>
      </div>
    );
  }

  // Pick the two participants to show (creator + joiner if available, else first two)
  const p1 = participants[0];
  const p2 = participants.find(p => p.userId?.username === joinerUsername) ?? participants[1];

  const matchCompleted = challenge?.status === 'completed';
  const p1Wins = revealed && p1 && p2 && (p1.score ?? 0) > (p2.score ?? 0);
  const p2Wins = revealed && p1 && p2 && (p2.score ?? 0) > (p1.score ?? 0);

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-3">
          ⚔️ Versus Battle Card
        </div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="text-gradient">Head-to-Head</span>
        </h1>
        {challenge && (
          <p className="text-slate-400 text-sm mt-2">Stakes: <span className="text-orange-400 font-semibold">"{challenge.stake}"</span></p>
        )}
      </div>

      {/* Battle card */}
      <div className="card-glass p-6 space-y-6">

        <div className="flex items-center justify-between gap-4">
          {p1 ? (
            <PlayerCard username={p1.userId?.username ?? '?'} score={revealed ? p1.score : undefined} isWinner={p1Wins} side="left" totalQuestions={challenge?.matchId.questions?.length} />
          ) : (
            <div className="player-card opacity-0 flex-1 text-center text-slate-600 text-sm">Waiting…</div>
          )}

          <div className="vs-badge opacity-0 flex flex-col items-center shrink-0">
            <span className="text-gradient font-black text-3xl leading-none" style={{ fontFamily: 'var(--font-display)' }}>VS</span>
            <span className="text-slate-600 text-xs mt-1">⚡</span>
          </div>

          {p2 ? (
            <PlayerCard username={p2.userId?.username ?? '?'} score={revealed ? p2.score : undefined} isWinner={p2Wins} side="right" totalQuestions={challenge?.matchId.questions?.length} />
          ) : (
            <div className="player-card opacity-0 flex-1 text-center text-slate-600 text-sm">No one's joined yet</div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Prediction comparisons */}
        {p1 && p2 && challenge?.matchId.questions ? (
          <div className="space-y-4">
            {challenge.matchId.questions.map((q, i) => {
              const v1 = String(p1.answers?.questionAnswers?.[i] || '—');
              const v2 = String(p2.answers?.questionAnswers?.[i] || '—');
              const r1 = p1.results?.questionResults?.[i];
              const r2 = p2.results?.questionResults?.[i];
              return (
                <VersusRow key={i} label={q.question} val1={v1} val2={v2} res1={r1} res2={r2} revealed={revealed} correctAnswer={q.correctAnswer} />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            {participants.length === 0
              ? 'No predictions yet — share the link to get challengers!'
              : 'Waiting for a second player to join...'}
          </div>
        )}

        {/* Reveal button (only if match is complete & results exist) */}
        {matchCompleted && p1 && p2 && !revealed && (
          <button onClick={() => setRevealed(true)} className="btn-primary w-full py-3 text-sm">
            🎭 Reveal Results!
          </button>
        )}

        {/* Winner banner */}
        {revealed && (p1Wins || p2Wins) && (
          <div className="text-center py-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <p className="text-orange-400 font-black text-xl" style={{ fontFamily: 'var(--font-display)' }}>
              🏆 @{p1Wins ? p1.userId?.username : p2.userId?.username} wins!
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Loser owes: <span className="text-white font-semibold">"{challenge?.stake}"</span>
            </p>
          </div>
        )}
        {revealed && !p1Wins && !p2Wins && p1 && p2 && (
          <div className="text-center py-3 rounded-xl bg-slate-700/30 border border-slate-600/50">
            <p className="text-white font-bold">🤝 It's a tie!</p>
            <p className="text-slate-400 text-sm mt-1">Both predicted equally well</p>
          </div>
        )}
      </div>

      {/* Not completed notice */}
      {!matchCompleted && (
        <div className="card-glass p-4 text-center text-sm text-slate-400 border-slate-700/50">
          ⏳ Results will be revealed once the match ends and admin updates the score
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/challenge/${id}`} className="btn-ghost flex-1 py-3 text-sm text-center">
          ← Back to Challenge
        </Link>
        <Link to="/matches" className="btn-ghost flex-1 py-3 text-sm text-center">
          New Challenge
        </Link>
      </div>
    </div>
  );
}
