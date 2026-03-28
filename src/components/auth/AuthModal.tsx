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
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { login, register } = useAuth();

  useEffect(() => {
    setIsLogin(initialMode === 'login');
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
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.username.trim()) throw new Error('Username is required');
        await register(formData.username, formData.email, formData.password);
      }
      onClose();
      window.location.reload(); 
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
            {isLogin ? 'Welcome Back' : 'Join the Clash'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isLogin ? 'Enter your details to access your dashboard' : 'Create an account to start your winning streak'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {!isLogin && (
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
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
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
              isLogin ? 'Login' : 'Create Account'
            )}
          </button>
        </form>

        <div className="relative z-10 mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? "New to CricClash?" : "Already a member?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-orange-400 font-black hover:text-orange-300 transition-colors"
            >
              {isLogin ? 'Join for free' : 'Log in instead'}
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
