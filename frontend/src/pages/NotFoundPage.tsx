import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🏏</div>
      <h1 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        404 — Stumped!
      </h1>
      <p className="text-slate-400 mb-8 max-w-md">
        This page was bowled out. The route you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary">← Back to Home</Link>
    </div>
  );
}
