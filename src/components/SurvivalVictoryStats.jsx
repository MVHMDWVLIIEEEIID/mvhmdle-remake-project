export default function SurvivalVictoryStats({
  stats,
  onNewRun,
  onBackToMenu,
}) {
  const totalGames = (stats?.wins || 0) + (stats?.losses || 0);
  const winRate =
    totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  return (
    <div className="min-h-screen bg-gameDark text-gameLight flex items-center justify-center px-6">
      <div className="w-full max-w-4xl rounded-3xl border border-gameLight/20 bg-white/[0.03] p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
            Run Complete
          </h1>
          <p className="text-gameLight/60 mt-2 uppercase tracking-widest text-xs">
            Survival Summary
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Win Rate" value={`${winRate}%`} />
          <StatCard label="Games Won" value={stats?.wins || 0} />
          <StatCard label="Games Lost" value={stats?.losses || 0} />
          <StatCard label="Words Guessed" value={stats?.wordsGuessed || 0} />
          <StatCard label="Words Typed" value={stats?.wordsTyped || 0} />
          <StatCard label="Highest Streak" value={stats?.highestStreak || 0} />
          <div className="col-span-2 md:col-span-3">
            <StatCard
              label="Most Cash Held"
              value={`$${(stats?.highestCash || 0).toLocaleString()}`}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <button
            onClick={onNewRun}
            className="w-full bg-gameLight text-gameDark font-black py-3.5 rounded-2xl uppercase tracking-widest text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Start New Run
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full bg-white/10 text-gameLight font-black py-3.5 rounded-2xl uppercase tracking-widest text-sm border border-gameLight/25 hover:bg-white/15 active:scale-95 transition-all"
          >
            Back To Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gameLight/15 bg-gameDark/50 p-4 md:p-5 text-center">
      <p className="text-2xl md:text-3xl font-black">{value}</p>
      <p className="text-[10px] md:text-xs uppercase tracking-widest text-gameLight/50 mt-2">
        {label}
      </p>
    </div>
  );
}
