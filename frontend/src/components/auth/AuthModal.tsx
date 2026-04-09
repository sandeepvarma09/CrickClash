import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from '@/lib/gsap';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { login, register, resetPassword } = useAuth();

  useEffect(() => {
    setView(initialMode);
    setSuccessMsg('');
    setError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      // Remove overshoot 'back.out' for stability
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.95, y: 10 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
        onClose();
      } else if (view === 'register') {
        if (!formData.username.trim()) throw new Error('Username is required');
        await register(formData.username, formData.email, formData.password);
        onClose();
      } else if (view === 'forgot') {
        await resetPassword(formData.email, formData.password);
        setSuccessMsg('Password has been reset successfully!');
        setFormData({ username: '', email: '', password: '' });
        setView('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4 bg-black/90 backdrop-blur-md">
      {/* Backdrop Trigger */}
      <div onClick={onClose} className="absolute inset-0 cursor-default" />

      {/* Modal Content - SOLID BACKGROUND FOR READABILITY */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-[#0f111a] border border-slate-700/50 rounded-[2rem] p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh]"
      >
        {/* Subtle accent glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            {view === 'login' ? 'Welcome Back' : view === 'forgot' ? 'Reset Password' : 'Join the Clash'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {view === 'login' ? 'Enter your details to access your dashboard' : view === 'forgot' ? 'Enter your email and a new password' : 'Create an account to start your winning streak'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {view === 'register' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Username</label>
              <input 
                type="text" 
                placeholder="pick a username"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-slate-600"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              required
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-slate-600"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
              {view === 'forgot' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-5 pr-12 py-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {view === 'login' && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl text-base font-black mt-6 shadow-xl shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 transition-transform"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              view === 'login' ? 'Login' : view === 'forgot' ? 'Reset Password' : 'Create Account'
            )}
          </button>
        </form>

        <div className="relative z-10 mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {view === 'register' ? "Already a member?" : "New to CricClash?"}
            <button 
              type="button"
              onClick={() => setView(view === 'register' ? 'login' : 'register')}
              className="ml-2 text-orange-400 font-black hover:text-orange-300 transition-colors"
            >
              {view === 'register' ? 'Log in instead' : 'Join for free'}
            </button>
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-600 hover:text-white transition-colors p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
