import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL, APP_URL as CENTRAL_APP_URL } from '@/config/api';

const API     = API_BASE_URL;
const APP_URL = CENTRAL_APP_URL;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Team       { name: string; shortName: string }
interface Question   { question: string; options: string[] }
interface MatchInfo  { teams: [Team, Team]; date: string; venue: string; format: string; status: string; questions?: Question[] }
interface ChallengeData {
  challengeId:  string;
  stake:        string;
  shareUrl:     string;
  status:       string;
  matchId:      MatchInfo;
  creatorId:    { username: string };
  participants: unknown[];
}
interface PredAnswers {
  questionAnswers: string[];
}

// ─── Share Buttons ─────────────────────────────────────────────────────────────
function ShareButtons({ challengeId, stake }: { challengeId: string; stake: string }) {
  const url  = `${APP_URL}/challenge/${challengeId}`;
  const text = `🏏 I just created a Cricket Clash challenge! Think you can beat my predictions? (Loser: ${stake}) ${url}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm font-medium">Share this challenge 👇</p>
      <div className="grid grid-cols-2 gap-3">
        <a id="share-whatsapp"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors">
          📱 WhatsApp
        </a>
        <a id="share-telegram"
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('🏏 Cricket Clash Challenge!')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
          ✈️ Telegram
        </a>
        <a id="share-twitter"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-500/30 bg-slate-500/10 text-slate-300 text-sm font-medium hover:bg-slate-500/20 transition-colors">
          𝕏 Twitter/X
        </a>
        <button id="share-copy-link" onClick={copyLink}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200
            ${copied ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`}>
          {copied ? '✅ Copied!' : '🔗 Copy Link'}
        </button>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5">
        <span className="text-slate-500 text-xs font-mono truncate block">{url}</span>
      </div>
    </div>
  );
}

// ─── Prediction row ────────────────────────────────────────────────────────────
function PredRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

// ─── Default questions ─────────────────────────────────────────────────────────
const STAKE_PRESETS = [
  'Buy biryani for everyone',
  "Wear opponent's jersey for a day",
  'Post a loser Instagram story',
  "Pay for the whole group's chai",
  'Drive everyone home after the match',
  'Bragging rights 😤',
];

function defaultMatchQuestions(t1: string, t2: string): Question[] {
  return [
    { question: 'Who will win the toss?',               options: [t1, t2] },
    { question: 'Who will win the match?',              options: [t1, t2] },
    { question: 'Who will be the top run scorer?',      options: [] },
    { question: 'Who will be the Player of the Match?', options: [] },
  ];
}

// ─── Join Form — Dynamic question-based ────────────────────────────────────────
function JoinForm({ challenge, onDone }: { challenge: ChallengeData; onDone: (id: string, u: string) => void }) {
  const t1 = challenge.matchId.teams[0].name;
  const t2 = challenge.matchId.teams[1].name;
  const questions: Question[] = challenge.matchId.questions?.length
    ? challenge.matchId.questions
    : defaultMatchQuestions(t1, t2);

  const [username, setUsername] = useState(localStorage.getItem('cricclash_username') || '');
  
  useEffect(() => {
    const handleStorage = () => {
      const u = localStorage.getItem('cricclash_username');
      if (u) setUsername(u);
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const [answers, setAnswers]     = useState<string[]>(Array(questions.length).fill(''));
  const [freeText, setFreeText]   = useState<string[]>(Array(questions.length).fill(''));
  const [stake, setStake]         = useState('');
  const [customStake, setCustomStake] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const finalStake = stake === 'custom' ? customStake : stake;

  const getAnswer = (qi: number) =>
    questions[qi].options.length > 0 ? answers[qi] : freeText[qi];

  const allAnswered = questions.every((q, i) =>
    q.options.length > 0 ? !!answers[i] : freeText[i].trim().length > 1
  );

  const valid = username.trim().length > 1 && allAnswered && finalStake.trim().length > 2;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true); setError('');
    try {
      await axios.post(`${API}/predictions`, {
        challengeId: challenge.challengeId,
        username:    username.trim(),
        stake:       finalStake.trim(),
        predictions: {
          questionAnswers: questions.map((_, i) => getAnswer(i) ?? ''),
        },
      });
      onDone(challenge.challengeId, username.trim());
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) setError(e.response?.data?.message ?? e.message);
      else setError('Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="card-glass p-6 space-y-5 border-orange-500/20">
      <div className="text-center">
        <p className="text-white font-bold text-lg">Think you can beat @{challenge.creatorId?.username}? 🏏</p>
        <p className="text-slate-400 text-sm mt-1">Answer the {questions.length} questions + pick your stake!</p>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Profile</label>
        {username ? (
          <div className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white flex items-center gap-2">
            <span>👤</span> <strong>@{username}</strong>
          </div>
        ) : (
          <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 text-orange-400 text-sm font-semibold">
            ⚠️ Please click "+ Login" in the top bar to log in before predicting!
          </div>
        )}
      </div>

      {/* Dynamic Questions */}
      <div className="border-t border-slate-700/50 pt-4 space-y-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Predictions</p>

        {questions.map((q, qi) => (
          <div key={qi}>
            <label className="block text-sm text-slate-300 mb-2">
              <span className="text-orange-400 font-bold mr-1">Q{qi + 1}.</span> {q.question}
            </label>
            {q.options.length > 0 ? (
              <div className={`grid gap-2 ${q.options.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {q.options.map(opt => (
                  <button key={opt} type="button" onClick={() => {
                    const next = [...answers]; next[qi] = opt; setAnswers(next);
                  }}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all
                      ${answers[qi] === opt
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input type="text" placeholder="Type your answer…"
                value={freeText[qi]} onChange={e => { const n = [...freeText]; n[qi] = e.target.value; setFreeText(n); }}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors text-sm" />
            )}
          </div>
        ))}
      </div>

      {/* Q5 — Stake selection */}
      <div className="border-t border-slate-700/50 pt-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span className="text-orange-400">Q{questions.length + 1}.</span> Your Stake 🎯 <span className="text-slate-600 normal-case font-normal">(what you'll owe if you lose)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {STAKE_PRESETS.map(s => (
            <button key={s} type="button" onClick={() => { setStake(s); setCustomStake(''); }}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all
                ${stake === s ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              {s}
            </button>
          ))}
          <button type="button" onClick={() => setStake('custom')}
            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all col-span-2
              ${stake === 'custom' ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            ✏️ Custom stake…
          </button>
        </div>
        {stake === 'custom' && (
          <input type="text" placeholder="Describe your punishment if you lose…"
            value={customStake} onChange={e => setCustomStake(e.target.value)}
            className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors text-sm" />
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">⚠️ {error}</div>}

      <button id="join-challenge-submit" onClick={submit} disabled={!valid || submitting}
        className={`btn-primary w-full py-3 text-sm ${(!valid || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {submitting ? '⏳ Submitting...' : '⚡ Lock My Predictions!'}
      </button>
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChallengePage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challenge,  setChallenge]  = useState<ChallengeData | null>(null);
  const [prediction, setPrediction] = useState<{ answers: PredAnswers } | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [joined,     setJoined]     = useState(false);
  const username = localStorage.getItem('cricclash_username');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API}/challenges/${id}`),
      axios.get(`${API}/challenges/${id}/predictions`)
    ]).then(([cRes, pRes]) => {
      setChallenge(cRes.data.data?.challenge ?? null);
      setPrediction(cRes.data.data?.creatorPrediction ?? null);
      setParticipants(pRes.data.data ?? []);
    })
    .catch(e => setError(e.response?.data?.message ?? 'Challenge not found'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card-glass p-10 animate-pulse space-y-4">
          <div className="h-7 w-48 bg-slate-700/70 rounded mx-auto" />
          <div className="h-4 w-32 bg-slate-700/50 rounded mx-auto" />
          <div className="h-32 bg-slate-700/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="card-glass border-red-500/30 p-10">
          <p className="text-red-400 font-bold text-lg mb-2">⚠️ Challenge Not Found</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link to="/matches" className="btn-primary text-sm px-6 py-2">← Browse Matches</Link>
        </div>
      </div>
    );
  }

  const { matchId: match } = challenge;
  const [t1, t2] = match.teams;
  const answers  = prediction?.answers;

  const handleJoinDone = (challengeId: string, joinerUsername: string) => {
    setJoined(true);
    // Navigate to versus page (TASK-09) passing the joiner username
    navigate(`/versus/${challengeId}?joiner=${encodeURIComponent(joinerUsername)}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-4">
          🏏 Challenge #{challenge.challengeId}
        </div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {t1.shortName} <span className="text-gradient">VS</span> {t2.shortName}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Created by <span className="text-orange-400 font-semibold">@{challenge.creatorId?.username}</span>
        </p>
      </div>

      {/* Match Info */}
      <div className="card-glass p-5 space-y-2 text-sm text-slate-400">
        <p>⚔️ <span className="text-white font-medium">{t1.name}</span> vs <span className="text-white font-medium">{t2.name}</span></p>
        <p>📍 {match.venue}</p>
        <p>📅 {new Date(match.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p>🏏 {match.format} · <span className={`capitalize ${match.status === 'live' ? 'text-green-400' : ''}`}>{match.status}</span></p>
      </div>

      {/* Stake */}
      <div className="card-glass p-5 bg-orange-500/5 border-orange-500/20">
        <p className="text-xs text-slate-400 mb-1 font-medium">🎯 What's at stake</p>
        <p className="text-white font-bold text-lg">"{challenge.stake}"</p>
      </div>

      {/* Creator's Predictions */}
      {answers && challenge.matchId.questions && (
        <div className="card-glass p-5">
          <p className="text-sm font-semibold text-slate-300 mb-3">
            @{challenge.creatorId?.username}'s predictions
          </p>
          {challenge.matchId.questions.map((q, i) => (
            <PredRow key={i} label={q.question} value={answers.questionAnswers?.[i] || 'N/A'} />
          ))}
        </div>
      )}

      {/* Join Form or Joined confirmation */}
      {challenge.status === 'open' && !joined && !participants.some(p => p.userId?.username === username) ? (
        <JoinForm challenge={challenge} onDone={handleJoinDone} />
      ) : (
        <div className="card-glass p-8 text-center border-orange-500/30 bg-orange-500/5 space-y-4">
          <div className="text-4xl">⚔️</div>
          <div>
            <p className="text-white font-bold text-lg">You are in this battle!</p>
            <p className="text-slate-400 text-sm">Your predictions are locked and safe.</p>
          </div>
          <Link to={`/versus/${challenge.challengeId}?joiner=${username}`} 
            className="btn-primary inline-block px-8 py-3 rounded-2xl shadow-xl shadow-orange-500/20">
            View Live Battle Card →
          </Link>
        </div>
      )}
      {joined && (
        <div className="card-glass p-6 text-center border-green-500/30 bg-green-500/5">
          <p className="text-green-400 font-bold text-lg mb-1">✅ You're in!</p>
          <p className="text-slate-400 text-sm">Redirecting to the Versus Battle Card…</p>
        </div>
      )}

      {/* Share */}
      <div className="card-glass p-5">
        <ShareButtons challengeId={challenge.challengeId} stake={challenge.stake} />
      </div>
    </div>
  );
}
