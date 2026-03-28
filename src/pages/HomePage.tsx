import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import axios from 'axios';

gsap.registerPlugin(ScrollTrigger);

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface UserEntry {
  _id: string; username: string;
  stats: { wins: number; totalChallenges: number; winStreak: number };
}

export default function HomePage() {
  const heroRef      = useRef<HTMLDivElement>(null);
  const titleRef     = useRef<HTMLHeadingElement>(null);
  const subtitleRef  = useRef<HTMLParagraphElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);
  const featuresRef  = useRef<HTMLElement>(null);
  const stepsRef     = useRef<HTMLElement>(null);
  const lbRef        = useRef<HTMLElement>(null);

  const [topPlayers, setTopPlayers] = useState<UserEntry[]>([]);

  // Fetch top 5 players
  useEffect(() => {
    axios.get(`${API}/leaderboard/global`).then(r => setTopPlayers((r.data.data ?? []).slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => {
    // Hero entrance
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current,   { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
      .fromTo(subtitleRef.current,{ opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
      .fromTo(ctaRef.current,     { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4');

    // Feature cards scroll-trigger
    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.querySelectorAll('.feature-card'),
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
        }
      );
    }

    // How it works steps
    if (stepsRef.current) {
      gsap.fromTo(
        stepsRef.current.querySelectorAll('.step-item'),
        { opacity: 0, x: -30 },
        {
          opacity: 1, x: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        }
      );
    }

    // Leaderboard preview
    if (lbRef.current) {
      gsap.fromTo(lbRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: lbRef.current, start: 'top 85%' },
      });
    }

    return () => { ScrollTrigger.getAll().forEach(st => st.kill()); };
  }, []);

  const FEATURES = [
    { emoji: '🎯', title: 'Make Predictions',  desc: '5 key questions per match — toss, winner, top scorer, runs & POTM.' },
    { emoji: '⚔️', title: 'Versus Battles',    desc: 'UFC-style battle card shows your picks vs your friend head-to-head.' },
    { emoji: '🏆', title: 'Win & Shame',        desc: 'Winner takes pride. Loser wears the jersey… or buys the biryani 🍗.' },
    { emoji: '👥', title: 'Group Mode',         desc: 'Invite your whole squad — see who picked what and who nailed it.' },
    { emoji: '🎖️', title: 'Earn Badges',        desc: 'Perfect Prediction, Win Streak, Lone Wolf — collect them all.' },
    { emoji: '📊', title: 'Live Leaderboard',  desc: 'Global & weekly rankings — see where you stand among all fans.' },
  ];

  const STEPS = [
    { n: '01', title: 'Pick a Match',        desc: 'Browse upcoming IPL & international matches.' },
    { n: '02', title: 'Lock 5 Predictions', desc: 'Toss, winner, scorer, runs, POTM.' },
    { n: '03', title: 'Set the Stake',       desc: 'Biryani? Jersey? Custom punishment.' },
    { n: '04', title: 'Share the Link',      desc: 'WhatsApp, Telegram, anywhere.' },
    { n: '05', title: 'Watch & Reveal',      desc: 'Results are revealed after the match ends.' },
  ];

  return (
    <div ref={heroRef} className="relative overflow-hidden">
      {/* ── Background glow ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
      </div>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center relative z-10">
        <div className="badge-brand text-sm mb-6 inline-flex">🏏 IPL 2026 is Live</div>

        <h1 ref={titleRef} className="text-5xl md:text-7xl font-black mb-6 leading-tight opacity-0"
          style={{ fontFamily: 'var(--font-display)' }}>
          <span className="text-white">Predictions</span><br />
          <span className="text-gradient">Decide Pride</span>
        </h1>

        <p ref={subtitleRef} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed opacity-0">
          Challenge friends, lock predictions, and prove who really knows cricket.
          No money. No fantasy. Pure bragging rights. 🏆
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <Link to="/matches" className="btn-primary text-lg px-8 py-4">⚡ Create a Challenge</Link>
          <Link to="/leaderboard" className="btn-ghost text-lg px-8 py-4">🏅 View Leaderboard</Link>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section ref={featuresRef} className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ emoji, title, desc }) => (
          <div key={title} className="feature-card card-glass p-6 opacity-0 hover:border-orange-500/30 transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{emoji}</div>
            <h3 className="text-white font-bold text-base mb-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section ref={stepsRef} className="max-w-2xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-black text-white text-center mb-8" style={{ fontFamily: 'var(--font-display)' }}>
          How it <span className="text-gradient">works</span>
        </h2>
        <div className="space-y-4">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="step-item opacity-0 flex items-start gap-4 card-glass p-5">
              <span className="text-orange-500 font-black text-2xl leading-none shrink-0"
                style={{ fontFamily: 'var(--font-display)' }}>{n}</span>
              <div>
                <p className="text-white font-bold text-sm">{title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top Players Preview ── */}
      {topPlayers.length > 0 && (
        <section ref={lbRef} className="max-w-2xl mx-auto px-4 pb-24 opacity-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
              🏆 Top Players
            </h2>
            <Link to="/leaderboard" className="text-orange-400 text-sm hover:text-orange-300 transition-colors">View all →</Link>
          </div>
          <div className="card-glass divide-y divide-slate-700/50">
            {topPlayers.map((u, i) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-slate-500 font-bold text-sm w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm border border-slate-600">🏏</div>
                <span className="text-white text-sm font-semibold flex-1">@{u.username}</span>
                <span className="text-orange-400 text-sm font-bold">{u.stats.wins}W</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="max-w-2xl mx-auto px-4 pb-28 text-center">
        <div className="card-glass p-10 bg-orange-500/5 border-orange-500/15">
          <p className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to prove yourself? 🏏
          </p>
          <p className="text-slate-400 text-sm mb-6">Create your first challenge in under 60 seconds.</p>
          <Link to="/matches" className="btn-primary text-base px-8 py-3">Start Now — It's Free</Link>
        </div>
      </section>
    </div>
  );
}
