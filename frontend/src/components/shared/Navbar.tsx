import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';

const NAV_LINKS = [
  { to: '/matches',        label: '🏏 Matches'        },
  { to: '/my-challenges',  label: '📋 My Challenges' },
  { to: '/leaderboard',    label: '🏆 Leaderboard'    },
];

export default function Navbar() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean, mode: 'login' | 'register' }>({ open: false, mode: 'login' });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProfileMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);
  
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const username = user?.username || '';

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

        {/* Desktop Nav */}
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
 
        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2" ref={dropdownRef}>
              {/* Profile Dropdown Trigger */}
              <button
                id="nav-profile-link"
                onClick={() => setProfileMenuOpen(v => !v)}
                className="group flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/50 hover:border-orange-500/40 hover:bg-slate-800/60 transition-all duration-300 shadow-lg shadow-black/20"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm shadow-inner transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold">{username[0].toUpperCase()}</span>
                </div>
                <div className="hidden sm:flex flex-col -gap-0.5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Player</p>
                  <p className="text-slate-200 text-xs font-black truncate max-w-[70px]">@{username}</p>
                </div>
                <span className={`hidden sm:block text-slate-500 text-xs ml-1 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {/* Desktop Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-4 top-14 w-56 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/5 bg-slate-800/40">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signed in as</p>
                    <p className="text-white font-black text-sm truncate">@{username}</p>
                  </div>
                  {/* Menu items */}
                  <div className="p-2 space-y-0.5">
                    <Link to={`/profile/${username}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all active:scale-95">
                      <span>👤</span><span>My Profile</span>
                    </Link>
                    <Link to="/my-challenges"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all active:scale-95">
                      <span>📋</span><span>My Challenges</span>
                    </Link>
                    <Link to="/leaderboard"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all active:scale-95">
                      <span>🏆</span><span>Leaderboard</span>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all active:scale-95">
                        <span>⚙️</span><span>Admin Panel</span>
                      </Link>
                    )}
                  </div>
                  <div className="p-2 border-t border-white/5">
                    <button
                      onClick={() => { logout(); setProfileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all active:scale-95">
                      <span>🚪</span><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setAuthModal({ open: true, mode: 'login' })}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute right-4 top-16 w-64 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* User Info Card (when logged in) */}
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-base text-white font-black shadow-lg shrink-0">
                  {username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signed in as</p>
                  <p className="text-white font-black text-sm">@{username}</p>
                </div>
              </div>
            )}

            {/* Navigation Section */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 px-1">Navigation</p>
              <div className="space-y-1.5">
                {NAV_LINKS.map(({ to, label }) => (
                  <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold transition-all active:scale-95 ${
                        isActive ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' : 'text-slate-300 hover:text-white bg-white/5 border border-transparent'
                      }`}>
                    {label}
                    <span className="ml-auto text-slate-600">›</span>
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold transition-all active:scale-95 ${
                        isActive ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' : 'text-slate-300 hover:text-white bg-white/5 border border-transparent'
                      }`}>
                    ⚙️ Admin Panel
                    <span className="ml-auto text-slate-600">›</span>
                  </NavLink>
                )}
              </div>
            </div>

            {/* Account Section (when logged in) */}
            {isAuthenticated ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 px-1">Account</p>
                <div className="space-y-1.5">
                  <Link to={`/profile/${username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/5 border border-transparent text-slate-300 hover:text-white text-base font-bold active:scale-95 transition-all">
                    <span>👤</span>
                    <span>My Profile</span>
                    <span className="ml-auto text-slate-600">›</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-base font-bold active:scale-95 transition-all mt-2">
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guest Section */
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 px-1">Account</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setMenuOpen(false); setAuthModal({ open: true, mode: 'login' }); }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 border border-slate-700/50 text-slate-200 text-base font-bold active:scale-95 transition-all">
                    🔑 Login
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setAuthModal({ open: true, mode: 'register' }); }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition-all">
                    ⚡ Get Started Free
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 text-center border-t border-white/5">
              <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">⚡ Powered by CricClash Engine</p>
            </div>

          </div>
        </div>
      )}

      {/* Premium Auth Modal */}
      <AuthModal 
        isOpen={authModal.open} 
        onClose={() => setAuthModal({ ...authModal, open: false })} 
        initialMode={authModal.mode} 
      />
    </header>
  );
}
