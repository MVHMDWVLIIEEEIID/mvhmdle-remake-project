import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";

// --- Definition Component (Unchanged) ---
function DefinitionSection({ word, open = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // refs to hold latest values so effects can read them without
  // requiring them in dependency arrays (prevents repeated effect runs)
  const definitionRef = useRef(definition);
  const loadingRef = useRef(loading);
  const errorRef = useRef(error);

  useEffect(() => {
    setDefinition(null);
    setError(false);
  }, [word]);

  useEffect(() => {
    definitionRef.current = definition;
  }, [definition]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    // controlled open: only run when `open` or `word` changes to avoid
    // re-running during the fetch which caused a glitch on first click.
    if (open) {
      setIsExpanded(true);
      // fetch if needed (read from refs to avoid effect deps)
      if (!definitionRef.current && !loadingRef.current && !errorRef.current) {
        (async () => {
          setLoading(true);
          try {
            const res = await fetch(
              `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
            );
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            const firstDef =
              data[0]?.meanings[0]?.definitions[0]?.definition ||
              "No definition found.";
            setDefinition(firstDef);
          } catch (err) {
            setError(true);
            setDefinition("Definition unavailable for this word.");
          } finally {
            setLoading(false);
          }
        })();
      }
    } else {
      setIsExpanded(false);
    }
  }, [open, word]);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (!definition) {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
        );
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        const firstDef =
          data[0]?.meanings[0]?.definitions[0]?.definition ||
          "No definition found.";
        setDefinition(firstDef);
      } catch (err) {
        setError(true);
        setDefinition("Definition unavailable for this word.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-6 pt-4 border-t border-white/10">
      <button
        onClick={handleToggle}
        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/80 transition-all duration-300"
      >
        <span>
          {isExpanded ? "Hide Definition" : `Show definition of ${word}`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3 h-3 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-500 ease-in-out w-full ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 w-full relative">
            {loading ? (
              <div className="flex justify-center py-2">
                <span className="loading loading-dots loading-sm text-white/50"></span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-serif italic text-gameLight/90 leading-relaxed">
                  "{definition}"
                </p>
                {error && (
                  <span className="text-[9px] text-red-400 uppercase font-bold mt-2 block">
                    API Error
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SurvivalGameModals({
  isOpen,
  onClose,
  onNext,
  onShare,
  onFullReset,
  stats,
}) {
  const MAX_HEARTS = 5;
  const [showModal, modalType] = isOpen;
  const defsRef = useRef([]);
  const [expandedDefs, setExpandedDefs] = useState([]);
  const BrokenHeartIcon = ({ className = "w-8 h-8" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      <path
        d="M13.7 6.4l-2.7 3.6 2.1.8-1.6 2.7 2.3.9-2.1 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gameDark"
      />
      <path
        d="M10.8 10.1l-1.7 1.5m3.6 2.3l-1.8 1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gameDark"
      />
    </svg>
  );
  const renderBossWordsInline = (words = []) =>
    words.map((w, i) => (
      <span key={i} className="inline-block">
        {i !== 0 ? ` , ` : ""}
        {w}
        {i === words.length - 1 ? `.` : ""}
      </span>
    ));
  const statCardBaseClass =
    "bg-white/[0.03] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[120px]";

  useEffect(() => {
    const handler = (e) => {
      const idx = e.detail?.index;
      if (typeof idx === "number") {
        setExpandedDefs((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        setTimeout(() => {
          const el = defsRef.current[idx];
          if (el && el.scrollIntoView)
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    };
    window.addEventListener("showDefinition", handler);
    return () => window.removeEventListener("showDefinition", handler);
  }, []);

  const getModalContent = () => {
    // [NEW] Victory Modal for beating the game
    if (modalType === "victory") {
      return {
        title: "YOU ARE A LEGEND",
        status: "success",
        content: (
          <div className="flex flex-col items-center gap-6 w-full text-center">
            <p className="text-sm font-bold text-gameGreen uppercase tracking-widest">
              Survival Run Completed
            </p>
            <p className="text-lg text-white/80 leading-relaxed">
              You have accumulated enough wealth to extract successfully.
              <br />
              <span className="text-gameYellow font-black">
                $1,000,000 COLLECTED
              </span>
            </p>
            <div className="bg-white/5 rounded-2xl p-6 w-full border border-gameGreen/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">
                    {stats.gamesPlayed}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    Games Played
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-gameYellow">
                    {stats.hearts}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    Hearts Left
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
        footer: (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onFullReset}
              className="w-full bg-gameGreen text-gameDark font-black py-4 rounded-2xl shadow-lg shadow-gameGreen/20 transition-all hover:scale-105 active:scale-95 uppercase text-sm tracking-widest"
            >
              Start New Run
            </button>
            <button
              onClick={onClose}
              className="text-xs text-white/30 uppercase font-bold hover:text-white transition-colors py-2"
            >
              Stay Here (Endless)
            </button>
          </div>
        ),
      };
    }

    if (modalType === "won") {
      return {
        title: stats.isBossGame ? `BOSS DEFEATED` : "You Won",
        status: "success",
        content: stats.lastReward && (
          <div className="flex flex-col w-full items-center">
            <div className="flex flex-col items-center gap-1 mb-4">
              <p className="text-[10px] text-gameGreen/50 uppercase tracking-widest font-bold">
                {stats.isBossGame
                  ? `Boss: ${stats.bossWordCount} words`
                  : "The word was"}
              </p>
              {stats.isBossGame ? (
                <div className="w-full">
                  <div
                    className={`text-[22px] font-black text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(74,222,128,0.25)] text-center mb-3`}
                  >
                    ( {renderBossWordsInline(stats.targetWords)} )
                  </div>

                  {/* per-word definition buttons removed by request */}
                </div>
              ) : (
                <p className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                  "{stats.targetWord}"
                </p>
              )}
            </div>

            <div className="flex gap-4 w-full mt-2">
              <div className="bg-white/5 border border-gameGreen/20 rounded-2xl w-1/3 flex flex-col items-center justify-center p-4">
                <span className="text-5xl font-black text-gameGreen">
                  {stats.streak}
                </span>
                <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest mt-2">
                  Streak
                </span>
              </div>
              <div className="bg-white/5 border border-gameGreen/20 rounded-2xl flex-1 p-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                  <span className="text-xs font-bold text-white/40 uppercase">
                    Earnings
                  </span>
                  <span className="text-2xl font-black text-gameGreen">
                    +${stats.lastReward.total.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-white/60">
                    <span>Win Bonus</span>
                    <span>+{stats.lastReward.breakdown.base}</span>
                  </div>
                  {stats.isBossGame ? (
                    <div className="flex justify-between text-[10px] font-mono text-white/60">
                      <span>
                        Boss Defeat Streak (
                        {stats.bossWordCount === 2
                          ? stats.boss2Count || 0
                          : stats.bossWordCount === 4
                            ? stats.boss4Count || 0
                            : 0}{" "}
                        times)
                      </span>
                      <span>
                        +
                        {stats.bossWordCount === 2
                          ? 2000 * stats.boss2Count || 0
                          : stats.bossWordCount === 4
                            ? 4000 * stats.boss4Count || 0
                            : 0}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-[10px] font-mono text-white/60">
                      <span>
                        Guesses Not Used (
                        {stats.lastReward.breakdown.unusedCount})
                      </span>
                      <span>+{stats.lastReward.breakdown.speed}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] font-mono text-white/60">
                    <span>Streak Bonus</span>
                    <span>+{stats.lastReward.breakdown.streak}</span>
                  </div>
                </div>
              </div>
            </div>
            {stats.isBossGame ? (
              <div className="w-full mt-4">
                {stats.bossWordCount === 4 && (
                  <div className="w-full flex justify-center">
                    {stats?.lastReward?.breakdown?.heartAdded ? (
                      <p className="text-gameRed text-[11px] font-black uppercase tracking-wider">
                        +1 Heart Added
                      </p>
                    ) : (
                      <p className="text-gameRed text-[11px] font-black uppercase tracking-wider">
                        +$50,000 Hearts Full Bonus
                      </p>
                    )}
                  </div>
                )}
                <div className="max-h-28 overflow-y-auto space-y-4 hide-scrollbar">
                  {stats.targetWords.map((word, idx) => (
                    <div key={idx} ref={(el) => (defsRef.current[idx] = el)}>
                      <DefinitionSection
                        word={word}
                        open={expandedDefs.includes(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DefinitionSection word={stats.targetWord} />
            )}
          </div>
        ),
      };
    }

    if (modalType === "lost-heart") {
      return {
        title: "Lost a Heart",
        status: "warning", // Changed to Warning (Yellow)
        content: (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-gameLight/50 uppercase">
              {stats.isBossGame ? `Boss Attempt Failed:` : `Attempt Failed:`}
            </p>
            <div className="flex gap-2">
              {[...Array(stats.hearts)].map((_, i) => (
                <span key={i} className="text-3xl">
                  {/* Active hearts remain red */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-gameRed"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </span>
              ))}
              {stats.hearts < MAX_HEARTS && (
                <span className="text-3xl">
                  <BrokenHeartIcon className="w-8 h-8 text-gameRed animate-pulse" />
                </span>
              )}
              {[
                ...Array(Math.max(0, MAX_HEARTS - (stats?.hearts || 0) - 1)),
              ].map((_, i) => (
                <span key={i} className="text-3xl grayscale opacity-30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-8 w-8 text-gameLight/50"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </span>
              ))}
            </div>
            {stats.isBossGame ? (
              <div className="text-2xl font-black text-gameLight uppercase text-center">
                ( {renderBossWordsInline(stats.targetWords)} )
              </div>
            ) : (
              <p className="text-4xl font-black text-gameLight uppercase">
                "{stats.targetWord}"
              </p>
            )}
            <div
              className={`${statCardBaseClass} w-full border-gameYellow/35 bg-gameYellow/6`}
            >
              <span className="text-5xl font-black text-gameYellow leading-none">
                {stats.streakBeforeLastLoss ?? stats.streak}
              </span>
              <span className="text-[10px] font-bold uppercase text-gameYellow/60 tracking-widest mt-2">
                Streak Was
              </span>
            </div>
            {stats.isBossGame ? (
              <div className="w-full mt-2">
                <div className="max-h-28 overflow-y-auto space-y-4 hide-scrollbar">
                  {stats.targetWords.map((word, idx) => (
                    <div key={idx} ref={(el) => (defsRef.current[idx] = el)}>
                      <DefinitionSection
                        word={word}
                        open={expandedDefs.includes(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DefinitionSection word={stats.targetWord} />
            )}
          </div>
        ),
        footer: (
          <div className="flex gap-4 w-full">
            <button
              onClick={onFullReset}
              className="w-full bg-gameRed text-gameDark font-black py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase text-sm"
            >
              Give Up
            </button>
            <button
              onClick={onNext}
              className="w-full bg-gameYellow text-gameDark font-black py-4 rounded-2xl shadow-lg shadow-gameYellow/20 transition-all hover:scale-105 active:scale-95 uppercase text-sm"
            >
              Continue
            </button>
          </div>
        ),
      };
    }

    if (modalType === "game-over") {
      return {
        title: "Game Over",
        status: "error",
        content: (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white/40 uppercase tracking-widest">
                {stats.isBossGame
                  ? `${stats.bossWordCount === 4 ? "4-Words Boss" : "2-Words Boss"} Was :`
                  : `The word was`}
              </p>
              {stats.isBossGame ? (
                <div className="text-2xl font-black text-gameLight uppercase drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] text-center">
                  ( {renderBossWordsInline(stats.targetWords)} )
                </div>
              ) : (
                <p className="text-4xl font-black text-gameLight uppercase drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
                  "{stats.targetWord}"
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <div className={statCardBaseClass}>
                <span className="text-4xl font-black text-gameRed leading-none">
                  {stats.gamesPlayed}
                </span>
                <span className="text-[10px] font-bold uppercase text-white/35 tracking-widest mt-2">
                  Games
                </span>
              </div>
              <div className={statCardBaseClass}>
                <span className="text-4xl font-black text-gameYellow leading-none">
                  ${stats.currency.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold uppercase text-white/35 tracking-widest mt-2">
                  Cash
                </span>
              </div>
            </div>
            {stats.isBossGame ? (
              <div className="w-full mt-2">
                <div className="max-h-28 overflow-y-auto space-y-4 hide-scrollbar">
                  {stats.targetWords.map((word, idx) => (
                    <div key={idx} ref={(el) => (defsRef.current[idx] = el)}>
                      <DefinitionSection
                        word={word}
                        open={expandedDefs.includes(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DefinitionSection word={stats.targetWord} />
            )}
          </div>
        ),
        footer: (
          <button
            onClick={onFullReset}
            className="w-full bg-gameRed text-gameDark font-black py-4 rounded-2xl shadow-lg shadow-gameRed/20 transition-all active:scale-95 uppercase text-sm tracking-widest"
          >
            Start Over
          </button>
        ),
      };
    }

    return { title: "", content: null, footer: null };
  };

  const modalData = getModalContent();

  return (
    <Modal
      isOpen={showModal}
      onClose={onClose}
      onNext={onNext}
      onShare={onShare}
      title={modalData.title}
      footer={modalData.footer}
      status={modalData.status}
    >
      {modalData.content}
    </Modal>
  );
}
