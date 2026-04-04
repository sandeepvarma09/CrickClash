import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Match } from '@/types';

import { API_BASE_URL } from '@/config/api';

const API = API_BASE_URL;

// ─── Stake presets ─────────────────────────────────────────────────────────────
const STAKE_PRESETS = [
  { label: '🍗 Buy biryani', value: 'Buy biryani for everyone' },
  { label: '👕 Wear jersey', value: "Wear opponent's jersey for a day" },
  { label: '📸 Story post', value: 'Post a loser Instagram story' },
  { label: '☕ Pay for chai', value: "Pay for the whole group's chai" },
  { label: '🚗 Drive everyone home', value: 'Drive everyone home after the match' },
  { label: '😤 Bragging rights', value: 'Bragging rights 😤' },
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const steps = ['Match', 'Predictions', 'Stake'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const complete = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-sm font-medium transition-all duration-300
              ${active ? 'text-orange-400' : ''}
              ${complete ? 'text-green-400' : ''}
              ${!active && !complete ? 'text-slate-600' : ''}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300
                ${active ? 'border-orange-500 bg-orange-500/20 text-orange-400' : ''}
                ${complete ? 'border-green-500 bg-green-500/20 text-green-400' : ''}
                ${!active && !complete ? 'border-slate-700 text-slate-600' : ''}`}>
                {complete ? '✓' : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px transition-colors duration-300 ${complete ? 'bg-green-500/50' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Team selector button ──────────────────────────────────────────────────────
function TeamBtn({
  team, selected, onClick,
}: { team: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 
        ${selected
          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
    >
      {team}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CreateChallengePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);

  // Match data
  const [match, setMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState('');

  // Prediction form (dynamic)
  const [answers, setAnswers] = useState<string[]>([]);
  const [freeText, setFreeText] = useState<string[]>([]);

  // Stake
  const [stake, setStake] = useState('');
  const [customStake, setCustomStake] = useState('');
  
  // Use localStorage username to enforce "Login first" rule
  const [username, setUsername] = useState(localStorage.getItem('cricclash_username') || '');

  // Keep it synced if they login while on the page
  useEffect(() => {
    const handleStorage = () => {
      const u = localStorage.getItem('cricclash_username');
      if (u) setUsername(u);
    };
    window.addEventListener('storage', handleStorage);
    // Also poll every second just in case same-tab localStorage doesn't fire storage event
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Fetch match details ────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    setMatchLoading(true);
    axios.get(`${API}/api/matches/${matchId}`)
      .then((r) => setMatch(r.data.data))
      .catch(() => setMatchError('Could not load match details'))
      .finally(() => setMatchLoading(false));
  }, [matchId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const teams = match?.teams ?? [];
  const t1 = teams[0]?.name ?? 'Team 1';
  const t2 = teams[1]?.name ?? 'Team 2';

  const questions = match?.questions?.length ? match.questions : [
    { question: 'Who will win the toss?', options: [t1, t2] },
    { question: 'Who will win the match?', options: [t1, t2] }
  ];

  const getAnswer = (i: number) => questions[i].options.length > 0 ? answers[i] : freeText[i];

  const finalStake = stake === '__custom__' ? customStake.trim() : stake;

  // ── Validation per step ───────────────────────────────────────────────────
  const step2Valid = questions.every((q, i) =>
    q.options.length > 0 ? !!answers[i] : (freeText[i] || '').trim().length >= 1
  );

  const step3Valid = finalStake.trim().length > 0 && username.trim().length > 1;

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!step3Valid) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await axios.post(`${API}/api/challenges`, {
        matchId,
        username: username.trim(),
        stake: finalStake,
        predictions: {
          questionAnswers: questions.map((_, i) => getAnswer(i) ?? ''),
        },
      });
      const challengeId = res.data.data?.challenge?.challengeId;
      navigate(`/challenge/${challengeId}`);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setSubmitError(e.response?.data?.message ?? e.message);
      } else {
        setSubmitError('Failed to create challenge. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render: loading / error ───────────────────────────────────────────────
  if (matchLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="card-glass p-10 animate-pulse">
          <div className="h-6 w-48 bg-slate-700/70 rounded mb-4 mx-auto" />
          <div className="h-4 w-32 bg-slate-700/50 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <div className="card-glass border-red-500/30 p-10">
          <p className="text-red-400 font-bold mb-2">⚠️ {matchError || 'Match not found'}</p>
          <button onClick={() => navigate('/matches')} className="btn-primary text-sm px-6 py-2 mt-4">
            ← Back to Matches
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="section-title text-center mb-1">Create Challenge</h1>
      <p className="text-slate-400 text-center text-sm mb-6">Lock your predictions and set the stakes</p>

      <StepBar current={step} />
      
      {/* ── Match Summary (Visible in steps 2 & 3) ── */}
      {step > 1 && match && (
        <div className="card-glass p-3 mb-6 flex items-center justify-between border-slate-700/50 bg-slate-800/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs">🏏</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs">🏏</div>
            </div>
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-wider">{match.teams[0].shortName} vs {match.teams[1].shortName}</p>
              <p className="text-slate-500 text-[10px]">{new Date(match.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · {match.format}</p>
            </div>
          </div>
          <button onClick={() => setStep(1)} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-widest px-2 py-1">
            Change
          </button>
        </div>
      )}

      {/* ══════════ STEP 1: Match Details ══════════ */}
      {step === 1 && (
        <div className="card-glass p-6 space-y-6">
          <div className="text-center">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border
              ${match.format === 'T20' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                match.format === 'ODI' ? 'bg-blue-500/20   text-blue-400   border-blue-500/30' :
                  match.format === 'TEST' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                    'bg-pink-500/20 text-pink-400 border-pink-500/30'}`}>
              {match.format}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center text-3xl border border-slate-600 mb-2">🏏</div>
              <p className="text-white font-bold">{teams[0]?.shortName}</p>
              <p className="text-slate-400 text-xs">{t1}</p>
            </div>
            <span className="text-gradient font-black text-2xl" style={{ fontFamily: 'var(--font-display)' }}>VS</span>
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center text-3xl border border-slate-600 mb-2">🏏</div>
              <p className="text-white font-bold">{teams[1]?.shortName}</p>
              <p className="text-slate-400 text-xs">{t2}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-slate-700/50 pt-4 space-y-2 text-sm text-slate-400">
            <p>📍 {match.venue}</p>
            <p>📅 {new Date(match.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>🕐 {new Date(match.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST</p>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full py-3">
            Next: Make Predictions →
          </button>
        </div>
      )}

      {/* ══════════ STEP 2: Predictions ══════════ */}
      {step === 2 && (
        <div className="card-glass p-6 space-y-6">

          {questions.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {i + 1}. {q.question}
              </label>
              {q.options.length > 0 ? (
                <div className="flex gap-3">
                  {q.options.map((opt: string) => (
                    <TeamBtn
                      key={opt}
                      team={opt}
                      selected={answers[i] === opt}
                      onClick={() => {
                        const newAns = [...answers];
                        newAns[i] = opt;
                        setAnswers(newAns);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Jasprit Bumrah"
                  value={freeText[i] || ''}
                  onChange={(e) => {
                    const n = [...freeText];
                    n[i] = e.target.value;
                    setFreeText(n);
                  }}
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className={`btn-primary flex-1 py-3 ${!step2Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next: Set Stake →
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 3: Stake + Username ══════════ */}
      {step === 3 && (
        <div className="card-glass p-6 space-y-6">

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Your Profile</label>
            {username ? (
              <div className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white flex items-center gap-2">
                <span>👤</span> <strong>@{username}</strong>
              </div>
            ) : (
              <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 text-orange-400 text-sm font-semibold">
                ⚠️ Please click "+ Login" in the top bar to create your profile before predicting!
              </div>
            )}
          </div>

          {/* Stake presets */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">What's the punishment? 😈</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {STAKE_PRESETS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setStake(s.value); setCustomStake(''); }}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200
                    ${stake === s.value && stake !== '__custom__'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStake('__custom__')}
                className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200
                  ${stake === '__custom__'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
              >
                ✏️ Custom...
              </button>
            </div>

            {stake === '__custom__' && (
              <input
                type="text"
                placeholder="Describe the punishment..."
                value={customStake}
                onChange={(e) => setCustomStake(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
              />
            )}
          </div>

          {/* Preview */}
          {finalStake && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm">
              <p className="text-slate-400 text-xs mb-1">Stakes preview:</p>
              <p className="text-white font-medium">"{finalStake}"</p>
            </div>
          )}

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="btn-ghost flex-1 py-3">← Back</button>
            <button
              id="create-challenge-submit"
              onClick={handleSubmit}
              disabled={!step3Valid || submitting}
              className={`btn-primary flex-1 py-3 ${(!step3Valid || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? '⏳ Creating...' : '🏏 Create Challenge!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
