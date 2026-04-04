import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ─── Layout (eager — needed for every route) ───────────────────────────────────
import Layout from '@/components/shared/Layout';
import ResultNotification from '@/components/shared/ResultNotification';

// ─── Pages (lazy-loaded for performance) ─────────────────────────────────────
const HomePage        = lazy(() => import('@/pages/HomePage'));
const MatchesPage     = lazy(() => import('@/pages/MatchesPage'));
const CreateChallenge = lazy(() => import('@/pages/CreateChallengePage'));
const ChallengePage   = lazy(() => import('@/pages/ChallengePage'));
const VersusPage      = lazy(() => import('@/pages/VersusPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const MyChallengesPage = lazy(() => import('@/pages/MyChallengesPage'));
const ProfilePage     = lazy(() => import('@/pages/ProfilePage'));
const AdminPage       = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage    = lazy(() => import('@/pages/NotFoundPage'));

// ─── Full-page loading spinner ────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl animate-bounce">🏏</span>
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading CricClash…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <ResultNotification />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"                          element={<HomePage />} />
            <Route path="/matches"                   element={<MatchesPage />} />
            <Route path="/challenge/create/:matchId" element={<CreateChallenge />} />
            <Route path="/challenge/:id"             element={<ChallengePage />} />
            <Route path="/versus/:id"                element={<VersusPage />} />
            <Route path="/leaderboard"               element={<LeaderboardPage />} />
            <Route path="/my-challenges"             element={<MyChallengesPage />} />
            <Route path="/profile/:username"         element={<ProfilePage />} />
            <Route path="/admin"                     element={<AdminPage />} />
            <Route path="*"                          element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
