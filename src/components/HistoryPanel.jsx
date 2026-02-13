import React from "react";

export default function HistoryPanel({ history, hearts }) {
  return (
    <div className="w-72 h-72 text-gameLight rounded-lg flex flex-col bg-[#0a0a0a] border-2 border-gameLight shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      <header className="h-12 flex-none bg-gameLight px-4 flex justify-between items-center border-b-2 border-gameLight/30">
        <h2 className="text-xs font-black uppercase text-gameDark leading-none">
          Hint History
        </h2>
        {/* Hearts Logic */}
        <div className="flex gap-1">
          {[...Array(hearts)].map((_, i) => (
            <span key={i} className="text-red-500 drop-shadow-sm">
              ❤️
            </span>
          ))}
          {[...Array(Math.max(0, 3 - hearts))].map((_, i) => (
            <span key={`lost-${i}`} className="text-gameDark/20 grayscale">
              🖤
            </span>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto clean-scroll p-2 space-y-2">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/20 text-xs italic uppercase">
            No hints used
          </div>
        ) : (
          history.map((log, idx) => (
            <div
              key={idx}
              className="bg-gameLight/5 border-l-2 border-gameGreen p-2 rounded"
            >
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-gameGreen uppercase">
                  {log.name}
                </span>
              </div>
              <p className="text-xs text-white/80 font-mono mt-1">{log.msg}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
