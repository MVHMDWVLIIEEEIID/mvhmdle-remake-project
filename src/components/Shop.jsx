import { useState } from "react";

export default function Shop() {
  const [currency, setCurrency] = useState(2500);

  const [hintsArray, setHintsArray] = useState({
    "Hide a Letter": { cost: 500, bought: 0, desc: "Discard 1 incorrect key." },
    "Vowel Letter": { cost: 500, bought: 0, desc: "Locate a hidden vowel." },
    "Yellow Letter": { cost: 500, bought: 0, desc: "Find a misplaced key." },
    "Green Letter": { cost: 800, bought: 0, desc: "Confirm a correct spot." },
    Row: { cost: 1200, bought: 0, desc: "+1 Survival Attempt." },
    "Beat The Game": { cost: 999999, bought: 0, desc: "Instant Extraction." },
  });

  const buyHint = (name) => {
    const hint = hintsArray[name];
    const currentPrice = Math.floor(
      hint.cost * Math.pow(1.5, hint.bought || 0),
    );

    if (currency >= currentPrice) {
      setCurrency((prev) => prev - currentPrice);
      setHintsArray((prev) => ({
        ...prev,
        [name]: { ...prev[name], bought: (prev[name].bought || 0) + 1 },
      }));
    }
  };

  return (
    <div className="h-72 w-72 text-gameLight rounded-lg flex flex-col bg-[#0a0a0a] border-2 border-gameLight shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* Header: Tactical Style */}
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

      {/* Item List */}
      <div className="flex-1 overflow-y-auto clean-scroll">
        {Object.entries(hintsArray).map(([name, data]) => {
          const currentPrice = Math.floor(
            data.cost * Math.pow(1.5, data.bought || 0),
          );
          const canAfford = currency >= currentPrice;

          return (
            <button
              key={name}
              onClick={() => buyHint(name)}
              disabled={!canAfford}
              className={`group w-full border-b border-gameLight/10 px-3 py-2.5 transition-all duration-200 flex flex-col h-14 justify-center relative
                ${canAfford ? "hover:bg-gameLight/5 active:bg-gameLight/10 cursor-pointer" : "opacity-30 cursor-not-allowed"}
              `}
            >
              {/* Highlight Bar on Hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gameLight scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />

              <div className="flex justify-between w-full items-center mb-0.5">
                <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-gameLight transition-colors">
                  {name}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    canAfford
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  ${currentPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between w-full items-center">
                <p className="text-[9px] text-white/40 leading-tight uppercase tracking-tighter font-medium">
                  {data.desc}
                </p>
                {data.bought > 0 && (
                  <span className="text-[8px] text-yellow-600 font-bold">
                    Bought :{" "}
                    {data.bought > 1
                      ? data.bought + " Times"
                      : data.bought + " Time"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
