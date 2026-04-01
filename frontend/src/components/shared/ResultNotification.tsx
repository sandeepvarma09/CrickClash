import { useEffect, useState } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '@/config/api';

const API = API_BASE_URL;

export default function ResultNotification() {
  const [data, setData] = useState<any>(null);
  const [show, setShow] = useState(false);
  const username = localStorage.getItem('cricclash_username');

  useEffect(() => {
    if (!username) return;

    // Check if we've already shown this notification
    const checkNotification = async () => {
      try {
        const res = await axios.get(`${API}/api/users/${username}/notifications/latest`);
        if (!res.data.data) return;

        const result = res.data.data;
        const lastSeen = localStorage.getItem(`cricclash_seen_${result.challenge.challengeId}`);
        
        if (!lastSeen) {
          setData(result);
          setShow(true);
        }
      } catch (e) {
        console.error('Failed to fetch notification:', e);
      }
    };

    checkNotification();
  }, [username]);

  const close = () => {
    if (data) {
      localStorage.setItem(`cricclash_seen_${data.challenge.challengeId}`, 'true');
    }
    setShow(false);
  };

  if (!show || !data) return null;

  const isWinner = data.winners.includes(username);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300">
        <div className="text-6xl mb-2">{isWinner ? '🏆' : '💸'}</div>
        
        <div>
          <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {isWinner ? 'Match Won!' : 'Match Over'}
          </h2>
          <p className="text-slate-400 text-sm">
            Challenge #{data.challenge.challengeId} is completed.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Winners</p>
          <div className="flex flex-wrap justify-center gap-2">
            {data.winners.map((w: string) => (
              <span key={w} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                @{w}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-orange-400">
            🎯 Stake: {data.stake}
          </p>
          <p className="text-xs text-slate-500 italic">
            {isWinner 
              ? `Time for @${data.losers.join(', @')} to give the party!` 
              : `Looks like you're giving the party to @${data.winners.join(', @')}!`}
          </p>
        </div>

        <button onClick={close}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
          Got it!
        </button>
      </div>
    </div>
  );
}
