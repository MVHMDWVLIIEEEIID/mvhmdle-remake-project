import React from "react";

export default function Shop({
  currency,
  hearts = 0,
  hintsArray,
  onBuyHint,
  hintsUsedInRound = {},
  gameState,
  isModalOpen,
}) {
  const MAX_HEARTS = 5;
  return (
    <div className="h-72 w-full text-gameLight rounded-lg flex flex-col bg-[#0a0a0a] border-2 border-gameLight shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      <header className="h-12 flex-none bg-gameLight px-4 flex justify-between items-center border-b-2 border-gameLight/30">
        <div className="flex flex-col">
          <h2 className="text-xs font-black uppercase text-gameDark leading-none">
            Hints Shop
          </h2>
        </div>
        <div className="bg-gameDark/10 px-2 py-1 rounded border border-gameDark/20">
          <span className="text-xs font-mono font-bold text-gameDark tracking-tighter">
            ${currency.toLocaleString()}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto clean-scroll">
        {Object.entries(hintsArray).map(([name, data]) => {
          const usedCount = hintsUsedInRound[name] || 0;
          const totalBought = data.bought || 0;
          let currentPrice;

          // --- PRICING LOGIC ---
          if (name === "Hide a Letter") {
            // Consumable: scales with round usage
            currentPrice = data.cost + usedCount * 150;
          } else if (name === "Heart") {
            // Permanent: scales linearly with lifetime purchases
            currentPrice = data.cost + totalBought * 25000;
          } else if (name === "Beat The Game") {
            currentPrice = data.cost;
          } else {
            // Standard Hints: Scale linearly 25%
            currentPrice = Math.floor(data.cost * (1 + totalBought * 0.25));
          }

          const canAfford = currency >= currentPrice;
          const isRoundOver = gameState !== "playing" || isModalOpen;

          let isLocked = false;
          if (name === "Hide a Letter") {
            isLocked = usedCount >= 5;
          } else if (name === "Heart") {
            isLocked = usedCount >= 1 || hearts >= MAX_HEARTS;
          } else if (
            [
              "Green Letter",
              "Yellow Letter",
              "Vowel Letter",
              "Row",
            ].includes(name)
          ) {
            isLocked = usedCount >= 1;
          }

          const isDisabled = !canAfford || isLocked || isRoundOver;

          return (
            <button
              key={name}
              onClick={() => onBuyHint(name, currentPrice)}
              disabled={isDisabled}
              className={`group w-full border-b border-gameLight/10 px-3 transition-all duration-200 flex flex-row items-center justify-between h-14 relative
                ${!isDisabled ? "hover:bg-gameLight/5 active:bg-gameLight/10 cursor-pointer" : "opacity-30 cursor-not-allowed"}
              `}
            >
              {/* Highlight Bar */}
              {!isDisabled && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gameLight scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
              )}

              {/* LEFT SIDE: Name & Description */}
              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 mr-2">
                <span
                  className={`text-xs font-black uppercase tracking-tight truncate w-full text-left transition-colors ${
                    !isDisabled
                      ? "text-white group-hover:text-gameLight"
                      : "text-white/40"
                  }`}
                >
                  {name}
                </span>
                <p className="text-[9px] text-white/40 leading-tight uppercase tracking-tighter font-medium text-left truncate w-full">
                  {data.desc}
                </p>
              </div>

              {/* RIGHT SIDE: Price & Level Stack */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mb-0.5 ${
                    canAfford
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  ${currentPrice.toLocaleString()}
                </span>

                {/* Level Display */}
                {name !== "Hide a Letter" && data.bought > 0 ? (
                  <span className="text-[8px] text-yellow-600 font-bold uppercase tracking-wide">
                    Lvl {data.bought}
                  </span>
                ) : // Empty placeholder to keep alignment consistent if needed, or just null
                null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
