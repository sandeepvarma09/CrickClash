import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import axios from 'axios';

const NAV_LINKS = [
  { to: '/matches',        label: '🏏 Matches'        },
  { to: '/my-challenges',  label: '📋 My Challenges' },
  { to: '/leaderboard',    label: '🏆 Leaderboard'    },
];

export default function Navbar() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [username,  setUsername]  = useState(localStorage.getItem('cricclash_username') ?? '');
  const [isAdmin,   setIsAdmin]   = useState(localStorage.getItem('cricclash_isAdmin') === 'true');
  const [inputOpen, setInputOpen] = useState(false);
  const [isLogin,   setIsLogin]   = useState(true);
  
  const [authDraft, setAuthDraft] = useState({ username: '', email: '', password: '' });

  const handleAuth = async () => {
    // TASK-AUTH: Front-end validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authDraft.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (authDraft.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (!isLogin && !authDraft.username.trim()) {
      alert('Username is required.');
      return;
    }

    try {
      const endpoint = isLogin ? '/users/login' : '/users/register';
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`, authDraft);
      
      const user = res.data.data;
      localStorage.setItem('cricclash_username', user.username);
      localStorage.setItem('cricclash_isAdmin', String(user.isAdmin));
      
      setUsername(user.username);
      setIsAdmin(user.isAdmin);
      setInputOpen(false);
      setAuthDraft({ username: '', email: '', password: '' });
      window.location.reload(); // Force notification check on login
    } catch (e: any) {
      console.error('Failed to auth:', e);
      alert(e.response?.data?.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{ background: 'rgba(10,10,15,0.88)', borderColor: 'var(--color-border)' }}
    >
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🏏</span>
          <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-gradient">Cricket</span>
            <span className="text-white"> Clash</span>
          </span>
        </Link>

        {/* Desktop Nav: Centered for arrangement */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
              {label}
            </NavLink>
          ))}
          {isAdmin && (
             <NavLink to="/admin"
               className={({ isActive }) =>
                 `px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                   isActive ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                 }`}>
               ⚙️ Admin
             </NavLink>
          )}
        </div>
 
        {/* Right: Profile Section (Noticeable) + CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {username ? (
            <div className="flex items-center gap-2">
              <Link to={`/profile/${username}`} id="nav-profile-link"
                className="group flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/50 hover:border-orange-500/40 hover:bg-slate-800/60 transition-all duration-300 shadow-lg shadow-black/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm shadow-inner transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold">{username[0].toUpperCase()}</span>
                </div>
                <div className="hidden sm:flex flex-col -gap-0.5">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Player</p>
                   <p className="text-slate-200 text-xs font-black truncate max-w-[70px]">@{username}</p>
                </div>
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('cricclash_username');
                  localStorage.removeItem('cricclash_isAdmin');
                  setUsername('');
                  setIsAdmin(false);
                  window.location.href = '/'; // Refresh and go home
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all active:scale-95"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setInputOpen(v => !v)} id="nav-set-username"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:border-orange-500/40 transition-all">
              Login
            </button>
          )}
 
          <Link to="/matches" className="btn-primary text-sm py-2.5 px-5 shrink-0 hidden sm:block">⚡ Play Now</Link>

          {/* Mobile burger */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 text-slate-400 hover:text-white transition-all transform active:scale-90">
             <div className="w-6 h-5 flex flex-col justify-between items-end">
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'w-6 translate-y-2 -rotate-45' : 'w-6'}`} />
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : 'w-4'}`} />
                <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'w-6 -translate-y-2.5 rotate-45' : 'w-2'}`} />
             </div>
          </button>
        </div>
      </nav>

      {/* Auth input popover */}
      {inputOpen && (
        <div className="absolute right-4 top-14 z-50 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl w-64">
          <div className="flex justify-between items-center mb-2">
             <p className="text-white text-xs font-semibold">{isLogin ? 'Login' : 'Register'}</p>
             <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] text-orange-400 font-semibold">{isLogin ? 'Create Account' : 'Switch to Login'}</button>
          </div>
          <p className="text-slate-400 text-[10px] mb-3">One account to rule them all!</p>
          
          {!isLogin && (
            <input type="text" placeholder="Username" value={authDraft.username}
              onChange={e => setAuthDraft({...authDraft, username: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 mb-2" />
          )}
          <input type="email" placeholder="Email" value={authDraft.email}
            onChange={e => setAuthDraft({...authDraft, email: e.target.value})}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 mb-2" />
          <input type="password" placeholder="Password" value={authDraft.password}
            onChange={e => setAuthDraft({...authDraft, password: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 mb-3" />
            
          <button onClick={handleAuth} className="btn-primary w-full text-xs py-2">{isLogin ? 'Login to Account' : 'Register'}</button>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto px-6 py-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">Navigation</p>
          <div className="space-y-2">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-5 py-4 rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                    isActive ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:text-white bg-white/5 shadow-inner'
                  }`}>
                {label}
              </NavLink>
            ))}
            {isAdmin && (
               <NavLink to="/admin" onClick={() => setMenuOpen(false)}
                 className={({ isActive }) =>
                   `block px-5 py-4 rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                     isActive ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:text-white bg-white/5 shadow-inner'
                   }`}>
                 ⚙️ Admin Panel
               </NavLink>
            )}
          </div>

          {username && (
            <div className="mt-12 pt-12 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">Account</p>
              <div className="grid gap-3">
                <Link to={`/profile/${username}`} onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 text-slate-300 font-bold active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs text-white">
                      {username[0].toUpperCase()}
                    </div>
                    <span>My Profile</span>
                  </div>
                  <span className="text-slate-600">→</span>
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('cricclash_username');
                    localStorage.removeItem('cricclash_isAdmin');
                    setUsername('');
                    setIsAdmin(false);
                    setMenuOpen(false);
                    window.location.href = '/';
                  }}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold active:scale-95 transition-all"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-20 text-center">
             <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">⚡ Powered by CricClash Engine</p>
          </div>
        </div>
      )}
    </header>
  );
}
