import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL, APP_URL as CENTRAL_APP_URL } from '@/config/api';

const API = API_BASE_URL;
const APP = CENTRAL_APP_URL;

const adminAxios = axios.create();

adminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (localStorage.getItem('adminToken')) {
        localStorage.removeItem('adminToken');
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Question { question: string; options: string[] }
interface MatchRow {
  _id: string;
  teams: [{ name: string; shortName: string }, { name: string; shortName: string }];
  date: string; venue: string; format: string; status: string;
  questions?: Question[];
}
interface ChallengeRow {
  _id: string; challengeId: string; stake: string; status: string;
  matchId?: { teams?: [{ shortName: string }, { shortName: string }]; date?: string };
  creatorId?: { username: string };
  participants: unknown[];
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const FORMATS = ['IPL', 'T20', 'ODI', 'TEST'];

const STAKE_PRESETS = [
  { label: '🍗 Buy biryani', value: 'Buy biryani for everyone' },
  { label: '👕 Wear jersey', value: "Wear opponent's jersey for a day" },
  { label: '📸 Instagram story', value: 'Post a loser Instagram story' },
  { label: '☕ Pay for chai', value: "Pay for the whole group's chai" },
  { label: '🚗 Drive everyone home', value: 'Drive everyone home after the match' },
  { label: '😤 Bragging rights', value: 'Bragging rights 😤' },
];

const TEAMS = [
  { name: 'Mumbai Indians', short: 'MI' },
  { name: 'Chennai Super Kings', short: 'CSK' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB' },
  { name: 'Kolkata Knight Riders', short: 'KKR' },
  { name: 'Delhi Capitals', short: 'DC' },
  { name: 'Rajasthan Royals', short: 'RR' },
  { name: 'Sunrisers Hyderabad', short: 'SRH' },
  { name: 'Punjab Kings', short: 'PBKS' },
  { name: 'Gujarat Titans', short: 'GT' },
  { name: 'Lucknow Super Giants', short: 'LSG' },
  { name: 'India', short: 'IND' },
  { name: 'Australia', short: 'AUS' },
  { name: 'England', short: 'ENG' },
  { name: 'Pakistan', short: 'PAK' },
  { name: 'New Zealand', short: 'NZ' },
  { name: 'South Africa', short: 'SA' },
  { name: 'West Indies', short: 'WI' },
  { name: 'Sri Lanka', short: 'SL' },
];

// ─── Default questions that auto-fill from teams ───────────────────────────────
function defaultQuestions(t1: string, t2: string): Question[] {
  return [
    { question: 'Who will win the toss?', options: [t1, t2] },
    { question: 'Who will win the match?', options: [t1, t2] },
    { question: 'Who will be the top run scorer?', options: [] },
    { question: 'Who will be the Player of the Match?', options: [] },
  ];
}

function adminHeaders(token: string) {
  return { 'x-admin-token': token };
}

// ─── Result Form (dynamic — uses match's own questions) ─────────────────────────
function ResultForm({ match, token, onSuccess }: { match: MatchRow; token: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const t1 = match.teams[0].name, t2 = match.teams[1].name;

  // Build answer state from the match's actual questions
  const questions = match.questions?.length
    ? match.questions
    : [
      { question: 'Who will win the toss?', options: [t1, t2] },
      { question: 'Who will win the match?', options: [t1, t2] },
      { question: 'Who will be the top run scorer?', options: [] },
      { question: 'Who will be the Player of the Match?', options: [] },
    ];

  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [freeText, setFreeText] = useState<string[]>(Array(questions.length).fill(''));

  const getAnswer = (qi: number) =>
    questions[qi].options.length > 0 ? answers[qi] : freeText[qi];

  const allAnswered = questions.every((q, i) =>
    q.options.length > 0 ? !!answers[i] : freeText[i].trim().length > 1
  );

  const save = async () => {
    if (!allAnswered) return;
    setSaving(true); setError('');
    try {
      // Map to legacy result shape (tossWinner, matchWinner, topRunScorer, totalRunsByWinner, playerOfTheMatch)
      const a0 = getAnswer(0) || t1;
      const a1 = getAnswer(1) || t1;
      const a2 = getAnswer(2) || 'TBD';
      const a3 = getAnswer(3) || 'TBD';
      await adminAxios.put(`${API}/api/admin/matches/${match._id}/result`, {
        tossWinner: a0,
        matchWinner: a1,
        topRunScorer: a2,
        totalRunsByWinner: 0,
        playerOfTheMatch: a3,
        // Also store correctAnswers back on the questions for display
        questionAnswers: questions.map((_, i) => getAnswer(i)),
      }, { headers: adminHeaders(token) });
      setOpen(false); onSuccess();
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.message ?? e.message) : 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
            ${match.status === 'completed' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10'}`}>
          {match.status === 'completed' ? '✏️ Edit Result' : 'Set Result'}
        </button>
      )}
      {open && (
        <div className="mt-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-4">
          <p className="text-xs font-semibold text-slate-300">🏆 Set Correct Answers</p>
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-xs text-slate-400 mb-1.5">
                <span className="text-orange-400 font-bold">Q{qi + 1}.</span> {q.question}
              </p>
              {q.options.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {q.options.map(opt => (
                    <button key={opt} type="button" onClick={() => {
                      const n = [...answers]; n[qi] = opt; setAnswers(n);
                    }}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all
                        ${answers[qi] === opt
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input type="text" placeholder="Correct answer…"
                  value={freeText[qi]} onChange={e => { const n = [...freeText]; n[qi] = e.target.value; setFreeText(n); }}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-orange-500/50" />
              )}
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">⚠️ {error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)}
              className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 text-xs hover:border-slate-500 transition-colors">Cancel</button>
            <button onClick={save} disabled={!allAnswered || saving}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                ${allAnswered && !saving ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
              {saving ? 'Saving…' : 'Save Result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Question Builder ─────────────────────────────────────────────────────────
function QuestionBuilder({ questions, onChange }: { questions: Question[]; onChange: (q: Question[]) => void }) {
  const setQ = (i: number, field: 'question', val: string) => {
    const next = questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q);
    onChange(next);
  };

  const setOption = (qi: number, oi: number, val: string) => {
    const next = questions.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options];
      opts[oi] = val;
      return { ...q, options: opts };
    });
    onChange(next);
  };

  const addOption = (qi: number) => {
    const next = questions.map((q, idx) =>
      idx === qi ? { ...q, options: [...q.options, ''] } : q
    );
    onChange(next);
  };

  const removeOption = (qi: number, oi: number) => {
    const next = questions.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.filter((_, i) => i !== oi) } : q
    );
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-semibold">📋 Prediction Questions (4)</p>
        <p className="text-xs text-slate-600">Users will answer these to create predictions</p>
      </div>
      {questions.map((q, qi) => (
        <div key={qi} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
              Q{qi + 1}
            </span>
            <input
              type="text"
              placeholder={`Question ${qi + 1}…`}
              value={q.question}
              onChange={e => setQ(qi, 'question', e.target.value)}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Options */}
          <div className="pl-8 space-y-2">
            <p className="text-xs text-slate-500">Answer options (leave empty for free text input)</p>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={e => setOption(qi, oi, e.target.value)}
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
                />
                <button type="button" onClick={() => removeOption(qi, oi)}
                  className="text-red-400/60 hover:text-red-400 text-xs transition-colors px-1">✕</button>
              </div>
            ))}
            {q.options.length < 6 && (
              <button type="button" onClick={() => addOption(qi)}
                className="text-xs text-slate-500 hover:text-orange-400 transition-colors">
                + Add option
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Edit Match Questions (inline) ────────────────────────────────────────────
function EditMatchQuestions({ match, token, onSuccess }: { match: MatchRow; token: string; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const t1 = match.teams[0].name, t2 = match.teams[1].name;
  const [questions, setQuestions] = useState<Question[]>(
    match.questions?.length ? [...match.questions] : defaultQuestions(t1, t2)
  );

  const save = async () => {
    setSaving(true); setError('');
    try {
      await adminAxios.put(`${API}/api/admin/matches/${match._id}/questions`, {
        questions: questions.filter(q => q.question.trim()),
      }, { headers: adminHeaders(token) });
      setEditing(false);
      onSuccess();
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.message ?? e.message) : 'Failed to update questions');
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
        ✏️ Edit Questions
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 bg-slate-800/60 rounded-xl border border-blue-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-400">✏️ Edit Questions</p>
        <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-300">✕ Cancel</button>
      </div>
      <QuestionBuilder questions={questions} onChange={setQuestions} />
      {error && <p className="text-red-400 text-xs">⚠️ {error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)}
          className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 text-xs hover:border-slate-500 transition-colors">Cancel</button>
        <button onClick={save} disabled={saving}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
            ${!saving ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
          {saving ? 'Saving…' : 'Save Questions'}
        </button>
      </div>
    </div>
  );
}

// ─── Create Match Form ────────────────────────────────────────────────────────
function CreateMatchForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  // Default date: 7 days from now at 19:30
  const defaultDateStr = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(19, 30, 0, 0);
    return d.toISOString().slice(0, 16); // for datetime-local input
  })();
  const [form, setForm] = useState({
    team1Name: '', team1Short: '', team2Name: '', team2Short: '',
    venue: '', format: 'IPL', matchDate: defaultDateStr,
  });
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions('', ''));

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const pickTeam = (slot: 1 | 2, t: typeof TEAMS[0]) => {
    setForm(p => {
      const updated = slot === 1
        ? { ...p, team1Name: t.name, team1Short: t.short }
        : { ...p, team2Name: t.name, team2Short: t.short };
      const t1 = slot === 1 ? t.name : p.team1Name;
      const t2 = slot === 2 ? t.name : p.team2Name;
      if (t1 && t2) {
        setQuestions(prev => prev.map((q, i) =>
          i < 2 ? { ...q, options: [t1, t2] } : q
        ));
      }
      return updated;
    });
  };

  const valid = !!(form.team1Name && form.team2Name && form.team1Name !== form.team2Name && form.venue.trim() && form.matchDate);

  const save = async () => {
    if (!valid) return;
    setSaving(true); setError('');
    try {
      await adminAxios.post(`${API}/api/admin/matches`, {
        team1Name: form.team1Name, team1Short: form.team1Short,
        team2Name: form.team2Name, team2Short: form.team2Short,
        venue: form.venue, format: form.format,
        date: new Date(form.matchDate).toISOString(),
        questions: questions.filter(q => q.question.trim()),
      }, { headers: adminHeaders(token) });
      setOpen(false);
      setForm({ team1Name: '', team1Short: '', team2Name: '', team2Short: '', venue: '', format: 'IPL', matchDate: defaultDateStr });
      setQuestions(defaultQuestions('', ''));
      onCreated();
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.message ?? e.message) : 'Failed to create match');
    } finally { setSaving(false); }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await adminAxios.get(`${API}/api/admin/seed`, { headers: adminHeaders(token) });
      onCreated();
    } catch { /* silent */ }
    finally { setSeeding(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setOpen(v => !v)} className="btn-primary text-xs px-4 py-2">
          {open ? '✕ Cancel' : '+ Create Match'}
        </button>
        <button onClick={seed} disabled={seeding}
          className="text-xs px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-orange-500/40 hover:text-orange-400 transition-all disabled:opacity-50">
          {seeding ? '⏳ Seeding…' : '🌱 Seed Mock Matches'}
        </button>
      </div>

      {open && (
        <div className="card-glass p-4 sm:p-5 space-y-5 border-orange-500/20">
          <h3 className="text-white font-bold text-sm">🏏 New Match</h3>

          {/* Teams */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([1, 2] as const).map(slot => {
              const nameKey = slot === 1 ? 'team1Name' : 'team2Name';
              const shortKey = slot === 1 ? 'team1Short' : 'team2Short';
              return (
                <div key={slot}>
                  <p className="text-xs text-slate-400 mb-1.5">Team {slot}</p>
                  <select value={form[nameKey]}
                    onChange={e => {
                      const found = TEAMS.find(t => t.name === e.target.value);
                      if (found) pickTeam(slot, found);
                      else set(nameKey, e.target.value);
                    }}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50">
                    <option value="">— Select team —</option>
                    <optgroup label="IPL Teams">
                      {TEAMS.slice(0, 10).map(t => <option key={t.short} value={t.name}>{t.name}</option>)}
                    </optgroup>
                    <optgroup label="International">
                      {TEAMS.slice(10).map(t => <option key={t.short} value={t.name}>{t.name}</option>)}
                    </optgroup>
                  </select>
                  {form[nameKey] && <p className="text-orange-400 text-xs mt-1">Short: {form[shortKey]}</p>}
                </div>
              );
            })}
          </div>

          {/* Format + Venue + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">🏟️ Format</p>
              <select value={form.format} onChange={e => set('format', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50">
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">📍 Venue</p>
              <input type="text" placeholder="e.g. Wankhede Stadium" value={form.venue} onChange={e => set('venue', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">📅 Match Date & Time</p>
              <input type="datetime-local" value={form.matchDate} onChange={e => set('matchDate', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 pt-2" />

          {/* Question Builder */}
          <QuestionBuilder questions={questions} onChange={setQuestions} />

          {/* 5th "question" explainer */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex gap-3 items-start">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-xs font-semibold text-orange-400">Q5 — The Stake (auto)</p>
              <p className="text-xs text-slate-500 mt-0.5">The 5th question is the bet/stake — users choose it when they join the challenge (e.g. "Buy biryani for everyone").</p>
            </div>
          </div>

          {form.team1Name && form.team2Name && form.team1Name === form.team2Name && (
            <p className="text-red-400 text-xs">⚠️ Teams must be different</p>
          )}
          {error && <p className="text-red-400 text-xs">⚠️ {error}</p>}

          <button onClick={save} disabled={!valid || saving}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
              ${valid && !saving ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            {saving ? '⏳ Creating…' : '🚀 Create Match'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Create Challenge Tab ────────────────────────────────────────────────────
function CreateChallengeTab({ token, matches }: { token: string; matches: MatchRow[] }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMatch, setSelected] = useState<MatchRow | null>(null);
  const [creator, setCreator] = useState('admin');
  const [stake, setStake] = useState('');
  const [customStake, setCustomStake] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ challengeId: string } | null>(null);
  // answers indexed by question index
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [freeText, setFreeText] = useState<string[]>(['', '', '', '']);

  const finalStake = stake === 'custom' ? customStake : stake;
  const t1 = selectedMatch?.teams[0].name ?? '';
  const t2 = selectedMatch?.teams[1].name ?? '';

  // Get the match questions (or defaults)
  const matchQuestions: Question[] = selectedMatch?.questions?.length
    ? selectedMatch.questions
    : defaultQuestions(t1, t2);

  const step1Valid = !!selectedMatch && creator.trim().length >= 2;

  // Step 2 valid: all 4 questions answered
  const step2Valid = matchQuestions.every((q, i) => {
    if (q.options.length > 0) return !!answers[i];
    return freeText[i]?.trim().length > 1;
  });

  const step3Valid = finalStake.trim().length > 2;

  const getAnswer = (qi: number, q: Question) =>
    q.options.length > 0 ? answers[qi] : freeText[qi];

  const submit = async () => {
    if (!selectedMatch || !step3Valid) return;
    setSaving(true); setError('');
    try {
      // Map answers back to the legacy prediction fields for compatibility
      const q = matchQuestions;
      const a0 = getAnswer(0, q[0]) ?? '';
      const a1 = getAnswer(1, q[1]) ?? '';
      const a2 = getAnswer(2, q[2]) ?? '';
      const a3 = getAnswer(3, q[3]) ?? '';

      const r = await adminAxios.post(`${API}/api/challenges`, {
        matchId: selectedMatch._id,
        username: creator.trim().toLowerCase(),
        stake: finalStake.trim(),
        predictions: {
          tossWinner: a0,
          matchWinner: a1,
          topRunScorer: a2,
          totalRunsByWinner: 0,
          playerOfTheMatch: a3,
        },
      }, { headers: adminHeaders(token) });
      setCreated({ challengeId: r.data.data?.challengeId });
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.message ?? e.message) : 'Failed');
    } finally { setSaving(false); }
  };

  const reset = () => {
    setStep(1); setSelected(null); setStake(''); setCustomStake('');
    setCreated(null); setError(''); setAnswers(['', '', '', '']); setFreeText(['', '', '', '']);
  };

  // ── Success screen ──
  if (created) {
    const url = `${APP}/challenge/${created.challengeId}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(`🏏 Cricket Prediction Challenge!\n\n${url}\n\nStake: ${finalStake}`)}`;
    return (
      <div className="max-w-lg mx-auto card-glass p-8 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <h3 className="text-xl font-black text-white">Challenge Created!</h3>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          <p className="text-orange-400 font-mono text-sm break-all">{url}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigator.clipboard.writeText(url)} className="btn-primary py-3 text-sm">📋 Copy Link</button>
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="block py-3 rounded-xl font-semibold text-sm border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
            📲 Share on WhatsApp
          </a>
          <Link to={`/challenge/${created.challengeId}`}
            className="block py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:border-slate-500 transition-all">
            👁️ View Challenge
          </Link>
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1">+ Create another</button>
        </div>
      </div>
    );
  }

  const StepDot = ({ n, label }: { n: number; label: string }) => {
    const active = step === n, done = step > n;
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all
          ${active ? 'border-orange-500 bg-orange-500/20 text-orange-400' : done ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-700 text-slate-600'}`}>
          {done ? '✓' : n}
        </span>
        <span className={`text-xs hidden sm:inline ${active ? 'text-orange-400' : done ? 'text-green-400' : 'text-slate-600'}`}>{label}</span>
        {n < 3 && <div className={`w-6 h-px mx-1 ${step > n ? 'bg-green-500/50' : 'bg-slate-700'}`} />}
      </div>
    );
  };

  const upcoming = matches.filter(m => m.status !== 'completed');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-center gap-1">
        <StepDot n={1} label="Match" />
        <StepDot n={2} label="Predictions" />
        <StepDot n={3} label="Stake" />
      </div>

      {/* Step 1 — Pick match */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-sm">1. Select a Match</h3>
          {upcoming.length === 0 && (
            <div className="card-glass p-6 text-center text-slate-500 text-sm">
              No upcoming matches. Use the <strong className="text-orange-400">🏏 Matches</strong> tab to create one first.
            </div>
          )}
          {upcoming.map(m => (
            <button key={m._id} type="button" onClick={() => {
              setSelected(m);
              setAnswers(['', '', '', '']);
              setFreeText(['', '', '', '']);
            }}
              className={`w-full text-left p-4 rounded-xl border transition-all
                ${selectedMatch?._id === m._id ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'}`}>
              <p className="text-white font-bold text-sm">{m.teams[0].shortName} vs {m.teams[1].shortName}</p>
              <p className="text-slate-400 text-xs mt-0.5">{m.format} · {m.venue} · {new Date(m.date).toLocaleDateString('en-IN')}</p>
              {m.questions && m.questions.length > 0 && (
                <p className="text-orange-400/70 text-xs mt-1">✅ {m.questions.length} custom questions defined</p>
              )}
            </button>
          ))}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Creator username</label>
            <input type="text" placeholder="e.g. admin" value={creator} onChange={e => setCreator(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50" />
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${step1Valid ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            Next: Lock Predictions →
          </button>
        </div>
      )}

      {/* Step 2 — Predictions (dynamic from match questions) */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back</button>
            <h3 className="text-white font-bold text-sm">2. Lock Your Predictions</h3>
          </div>
          <div className="card-glass p-4 text-sm text-slate-400">🏏 {t1} vs {t2}</div>

          {matchQuestions.map((q, qi) => (
            <div key={qi}>
              <p className="text-xs font-semibold text-slate-300 mb-2">
                <span className="text-orange-400 mr-1">Q{qi + 1}.</span> {q.question}
              </p>
              {q.options.length > 0 ? (
                // Multiple choice
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map(opt => (
                    <button key={opt} type="button" onClick={() => {
                      const next = [...answers]; next[qi] = opt; setAnswers(next);
                    }}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all
                        ${answers[qi] === opt ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                // Free text
                <input type="text" placeholder="Type your answer…"
                  value={freeText[qi]} onChange={e => { const n = [...freeText]; n[qi] = e.target.value; setFreeText(n); }}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50" />
              )}
            </div>
          ))}

          <button onClick={() => setStep(3)} disabled={!step2Valid}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${step2Valid ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            Next: Set the Stake →
          </button>
        </div>
      )}

      {/* Step 3 — Stake (Q5) */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back</button>
            <h3 className="text-white font-bold text-sm">3. Q5 — Set the Stake 🎯</h3>
          </div>
          <p className="text-slate-500 text-xs">This is the bet — the loser pays this price!</p>

          <div className="grid grid-cols-2 gap-3">
            {STAKE_PRESETS.map(({ label, value }) => (
              <button key={value} type="button" onClick={() => { setStake(value); setCustomStake(''); }}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition-all
                  ${stake === value ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => setStake('custom')}
              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all col-span-2
                ${stake === 'custom' ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              ✏️ Custom stake…
            </button>
          </div>
          {stake === 'custom' && (
            <input type="text" placeholder="Describe the punishment for the loser…"
              value={customStake} onChange={e => setCustomStake(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50" />
          )}
          {finalStake && selectedMatch && (
            <div className="card-glass p-4 space-y-1.5 border-orange-500/20">
              <p className="text-xs text-slate-400">📋 Summary</p>
              <p className="text-white text-sm font-bold">{t1} vs {t2}</p>
              <p className="text-orange-400 text-xs">🎯 {finalStake}</p>
              <p className="text-slate-400 text-xs">by @{creator}</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}
          <button onClick={submit} disabled={!step3Valid || saving}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${step3Valid && !saving ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            {saving ? '⏳ Creating…' : '🚀 Create Challenge & Get Link'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [creds, setCreds] = useState({ username: 'admin', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true); setError('');
    try {
      const r = await adminAxios.post(`${API}/api/admin/login`, creds);
      const token = r.data.data?.token;
      localStorage.setItem('adminToken', token);
      onLogin(token);
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.message ?? 'Login failed') : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 card-glass p-8 space-y-5">
      <div className="text-center"><p className="text-2xl mb-1">🔐</p><h2 className="text-white font-bold text-lg">Admin Login</h2></div>
      {(['username', 'password'] as const).map(f => (
        <div key={f}>
          <label className="text-xs text-slate-400 capitalize block mb-1">{f}</label>
          <input type={f === 'password' ? 'password' : 'text'} id={`admin-${f}`}
            value={creds[f]} onChange={e => setCreds(p => ({ ...p, [f]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50" />
        </div>
      ))}
      {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}
      <button id="admin-login-btn" onClick={login} disabled={loading}
        className={`btn-primary w-full py-3 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
type Tab = 'create' | 'matches' | 'challenges';

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // Hard route protection
  const isGlobalAdmin = localStorage.getItem('cricclash_isAdmin') === 'true';
  if (!isGlobalAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-red-500">
        <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>Access Denied</h1>
        <p className="text-slate-400">You do not have permission to view the admin controls.</p>
        <Link to="/matches" className="btn-primary mt-6 inline-block px-6 py-2 text-sm">Return to Matches</Link>
      </div>
    );
  }

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loadingM, setLoadingM] = useState(false);
  const [loadingC, setLoadingC] = useState(false);

  const fetchMatches = () => {
    setLoadingM(true);
    // Use admin endpoint so newly created matches appear immediately
    adminAxios.get(`${API}/api/admin/matches?limit=50`, { headers: adminHeaders(token) })
      .then(r => {
        const data = r.data.data;
        setMatches(Array.isArray(data) ? data : (data?.items ?? []));
      })
      .catch(() => setMatches([]))
      .finally(() => setLoadingM(false));
  };

  const fetchChallenges = () => {
    setLoadingC(true);
    adminAxios.get(`${API}/api/admin/challenges`, { headers: adminHeaders(token) })
      .then(r => setChallenges(r.data.data ?? []))
      .finally(() => setLoadingC(false));
  };

  useEffect(() => {
    if (!token) return;
    fetchMatches();
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const deleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge?')) return;
    await adminAxios.delete(`${API}/api/admin/challenges/${id}`, { headers: adminHeaders(token) });
    fetchChallenges();
  };

  const deleteMatch = async (id: string) => {
    if (!confirm('Delete this match? This will also remove linked challenges.')) return;
    try {
      await adminAxios.delete(`${API}/api/admin/matches/${id}`, { headers: adminHeaders(token) });
      fetchMatches();
    } catch (e) {
      alert(axios.isAxiosError(e) ? (e.response?.data?.message ?? 'Failed to delete') : 'Failed to delete');
    }
  };

  if (!token) return <AdminLogin onLogin={t => setToken(t)} />;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'create', label: '⚡ Create Challenge' },
    { id: 'matches', label: '🏏 Matches' },
    { id: 'challenges', label: '⚔️ All Challenges' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title mb-0">⚙️ Admin Panel</h1>
          <p className="text-slate-400 text-sm">Create challenges, manage matches &amp; results</p>
        </div>
        <button onClick={() => { localStorage.removeItem('adminToken'); setToken(''); }}
          className="text-xs px-3 py-1.5 border border-slate-700 rounded-lg text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-colors">
          Logout
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} id={`admin-tab-${id}`}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all
              ${activeTab === id ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        loadingM
          ? <div className="h-40 rounded-xl bg-slate-800/50 animate-pulse" />
          : <CreateChallengeTab token={token} matches={matches} />
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-slate-400 text-sm">{matches.length} matches in DB</p>
            <button onClick={fetchMatches}
              className="text-xs px-3 py-1.5 border border-slate-700 rounded-lg text-slate-400 hover:border-orange-500/30 hover:text-orange-400 transition-colors">
              🔄 Refresh
            </button>
          </div>

          <CreateMatchForm token={token} onCreated={fetchMatches} />

          {loadingM && <div className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />}
          {!loadingM && matches.map(m => (
            <div key={m._id} className="card-glass p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{m.teams[0].shortName} vs {m.teams[1].shortName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">📍 {m.venue} · {m.format} · {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(m.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                      ${m.status === 'live' ? 'bg-green-500/20 text-green-400' : m.status === 'completed' ? 'bg-slate-700/50 text-slate-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {m.status}
                    </span>
                    {m.questions && m.questions.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                        📋 {m.questions.length} questions
                      </span>
                    )}
                  </div>
                  {/* Show the questions */}
                  {m.questions && m.questions.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {m.questions.map((q, i) => (
                        <p key={i} className="text-xs text-slate-500">
                          <span className="text-orange-400/70">Q{i + 1}.</span> {q.question}
                          {q.options.length > 0 && <span className="text-slate-600"> ({q.options.join(' / ')})</span>}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
                  <ResultForm match={m} token={token} onSuccess={fetchMatches} />
                  <EditMatchQuestions match={m} token={token} onSuccess={fetchMatches} />
                  <button onClick={() => deleteMatch(m._id)}
                    className="text-xs px-2 py-1 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{challenges.length} challenges</p>
            <button onClick={fetchChallenges}
              className="text-xs px-3 py-1.5 border border-slate-700 rounded-lg text-slate-400 hover:border-orange-500/30 hover:text-orange-400 transition-colors">
              🔄 Refresh
            </button>
          </div>
          {loadingC && <div className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />}
          {!loadingC && challenges.map(ch => (
            <div key={ch._id} className="card-glass p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white font-bold text-sm font-mono">#{ch.challengeId}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {ch.matchId?.teams ? `${ch.matchId.teams[0].shortName} vs ${ch.matchId.teams[1].shortName}` : 'Unknown'} ·
                  by @{ch.creatorId?.username ?? '?'} · {ch.participants.length} participants
                </p>
                <p className="text-orange-400 text-xs mt-0.5">🎯 {ch.stake}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                  ${ch.status === 'open' ? 'bg-green-500/20 text-green-400' : ch.status === 'completed' ? 'bg-slate-700/50 text-slate-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {ch.status}
                </span>
                {ch.matchId && <EditMatchQuestions match={ch.matchId as any} token={token} onSuccess={fetchChallenges} />}
                <Link to={`/challenge/${ch.challengeId}`}
                  className="text-xs px-2 py-1 border border-slate-700 text-slate-400 rounded-lg hover:border-slate-500 transition-colors">
                  View →
                </Link>
                <button onClick={() => deleteChallenge(ch._id)}
                  className="text-xs px-2 py-1 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                  🗑️
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
