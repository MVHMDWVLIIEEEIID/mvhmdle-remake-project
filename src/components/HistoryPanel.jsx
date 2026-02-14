import React from "react";

export default function HistoryPanel({ history, hearts }) {
  return (
    <div className="w-72 h-72 text-gameLight rounded-lg flex flex-col bg-[#0a0a0a] border-2 border-gameLight shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      <style>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-history-entry {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      <header className="h-12 flex-none bg-gameLight px-4 flex justify-between items-center border-b-2 border-gameLight/30">
        <h2 className="text-xs font-black uppercase text-gameDark leading-none">
          History
        </h2>
        <div className="flex gap-1">
          {[...Array(hearts)].map((_, i) => (
            <span key={i} className="drop-shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gameRed w-6 h-6"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </span>
          ))}
          {[...Array(Math.max(0, 3 - hearts))].map((_, i) => (
            <span key={`lost-${i}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gameDark/30 w-6 h-6"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </span>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto clean-scroll p-2 space-y-2">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/20 text-xs italic uppercase">
            No history yet
          </div>
        ) : (
          [...history].reverse().map((log, idx) => {
            if (log.type === "game-marker") {
              const isWin = log.result === "won";
              return (
                <div
                  key={idx}
                  className={`animate-history-entry flex items-center justify-between p-2 rounded-lg border ${
                    isWin
                      ? "bg-gameGreen/10 border-gameGreen/40"
                      : "bg-gameRed/10 border-gameRed/40"
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase ${isWin ? "text-gameGreen" : "text-gameRed"}`}
                  >
                    {/* UPDATED: Uses dedicated gameCount property */}
                    Game {log.gameCount}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWin ? "bg-gameGreen text-gameDark" : "bg-gameRed text-gameDark"}`}
                  >
                    {isWin ? "WIN" : "LOSS"}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="animate-history-entry bg-white/5 border-l-2 border-gameGreen p-2 rounded-r"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-gameGreen uppercase">
                    {log.name}
                  </span>
                  <span className="text-[9px] font-mono text-white/40 bg-white/5 px-1 rounded">
                    -${log.spent?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-white/80 font-mono leading-tight">
                  {log.msg}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
