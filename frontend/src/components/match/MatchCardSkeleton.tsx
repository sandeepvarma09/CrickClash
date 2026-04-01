export default function MatchCardSkeleton() {
  return (
    <div className="card-glass p-5 flex flex-col gap-4 animate-pulse">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-12 rounded-full bg-slate-700/70" />
        <div className="h-4 w-14 rounded bg-slate-700/70" />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-slate-700/70" />
          <div className="h-4 w-12 rounded bg-slate-700/70" />
          <div className="h-3 w-20 rounded bg-slate-700/50" />
        </div>
        <div className="h-7 w-8 rounded bg-slate-700/70" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-slate-700/70" />
          <div className="h-4 w-12 rounded bg-slate-700/70" />
          <div className="h-3 w-20 rounded bg-slate-700/50" />
        </div>
      </div>

      {/* Venue + date */}
      <div className="border-t border-slate-700/50 pt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-700/50" />
        <div className="h-3 w-1/2 rounded bg-slate-700/50" />
      </div>

      {/* CTA */}
      <div className="h-10 w-full rounded-lg bg-slate-700/70 mt-auto" />
    </div>
  );
}
