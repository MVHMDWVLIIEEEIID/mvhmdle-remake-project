import React, { useState, useEffect } from "react";
import Modal from "./Modal";

// --- DaisyUI Countdown Component ---
function ModalCountdown({ status }) {
  const getNextMidnight = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const [targetDate, setTargetDate] = useState(getNextMidnight());
  const [timeLeft, setTimeLeft] = useState(targetDate - window.Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = targetDate - now;

      if (remaining <= 0) {
        const nextTarget = getNextMidnight();
        setTargetDate(nextTarget);
        setTimeLeft(nextTarget - now);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeft / (1000 * 60)) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  // Determine color based on status
  const colorClass = status === "lost" ? "text-gameRed" : "text-gameGreen";

  return (
    <div className="grid grid-flow-col gap-1 text-center auto-cols-max text-white items-center justify-center">
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": h, "--digits": 2 }}></span>
        </span>
      </div>
      <span className={`${colorClass} text-xl pb-1`}>:</span>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": m, "--digits": 2 }}></span>
        </span>
      </div>
      <span className={`${colorClass} text-xl pb-1`}>:</span>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": s, "--digits": 2 }}></span>
        </span>
      </div>
    </div>
  );
}

// --- Definition Component ---
function DefinitionSection({ word }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setDefinition(null);
  }, [word]);

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
        setDefinition(
          data[0]?.meanings[0]?.definitions[0]?.definition ||
            "No definition found.",
        );
      } catch (err) {
        setDefinition("Definition unavailable.");
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
        <span>{isExpanded ? "Hide Definition" : "Show Definition"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-500 ease-in-out w-full ${isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}
      >
        <div className="overflow-hidden">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 w-full text-center">
            {loading ? (
              <span className="loading loading-dots loading-sm text-white/50"></span>
            ) : (
              <p className="text-xs font-serif italic text-gameLight/90">
                "{definition}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailyGameModals({ isOpen, onClose, onShare, stats }) {
  const [showModal, modalType] = isOpen;

  const getModalContent = () => {
    if (modalType === "won") {
      return {
        title: "You Won",
        status: "success",
        content: (
          <div className="flex flex-col items-center w-full">
            <div className="flex flex-col items-center gap-1 mb-6">
              <p className="text-[10px] text-gameGreen/50 uppercase tracking-widest font-bold">
                The word was
              </p>
              <p className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                "{stats.targetWord}"
              </p>
            </div>

            <div className="flex gap-3 w-full">
              {/* Streak */}
              <div className="bg-white/5 border border-gameGreen/20 rounded-2xl flex-1 flex flex-col items-center justify-center p-4">
                <span className="text-4xl font-black text-gameGreen">
                  {stats.streak}
                  {stats.streak > 3 ? " 🔥" : ""}
                </span>
                <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest mt-1">
                  Streak
                </span>
              </div>

              {/* Countdown - Green Theme */}
              <div className="bg-white/5 border border-gameGreen/20 rounded-2xl flex-1 flex flex-col items-center justify-center p-4">
                <ModalCountdown status="won" />
                <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest mt-1">
                  Next Word
                </span>
              </div>
            </div>

            <DefinitionSection word={stats.targetWord} />
          </div>
        ),
      };
    }

    if (modalType === "lost") {
      return {
        title: "Game Over",
        status: "error",
        content: (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white/40 uppercase tracking-widest">
                The word was
              </p>
              <p className="text-4xl font-black text-white uppercase drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
                "{stats.targetWord}"
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <div className="bg-white/5 border border-gameRed/20 rounded-2xl flex-1 p-4 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gameRed">0</span>
                <span className="text-[9px] font-bold uppercase text-gameRed/50 tracking-widest mt-1">
                  Streak Lost
                </span>
              </div>

              {/* Countdown - Red Theme */}
              <div className="bg-white/5 border border-gameRed/20 rounded-2xl flex-1 flex flex-col items-center justify-center p-4">
                <ModalCountdown status="lost" />
                <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest mt-1">
                  Next Word
                </span>
              </div>
            </div>

            <DefinitionSection word={stats.targetWord} />
          </div>
        ),
      };
    }
    return { title: "", content: null };
  };

  const modalData = getModalContent();

  return (
    <Modal
      isOpen={showModal}
      onClose={onClose}
      onShare={onShare}
      title={modalData.title}
      status={modalData.status}
      footer={
        <div className="flex gap-4 w-full">
          <button
            onClick={onShare}
            className="w-full bg-gameGreen text-gameDark font-black py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase text-sm"
          >
            Share Result
          </button>
        </div>
      }
    >
      {modalData.content}
    </Modal>
  );
}
