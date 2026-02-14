import { useState } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import DailyGameModals from "../components/DailyGameModals";
import useDailyGame from "../hooks/useDailyGame";
import Toast from "../components/Toast";
import confetti from "canvas-confetti"; // Import confetti

export default function Daily({ mode = "daily" }) {
  // 1. Call the hook FIRST
  const game = useDailyGame(mode);

  // 2. Initialize Modal State
  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (game.gameState === "won") return [true, "won"];
    if (game.gameState === "lost") return [true, "lost"];
    return [false, "playing"];
  });

  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, msg, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2500,
    );
  };

  // --- NEW: Advanced Confetti Animation ---
  const handleConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ["#ed143d", "#3498db", "#ffd500", "#00e196"];

    const frame = () => {
      if (Date.now() > end) return;

      // Left side confetti
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 75,
        origin: { x: 0, y: 0.75 },
        colors,
      });

      // Right side confetti
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 75,
        origin: { x: 1, y: 0.75 },
        colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  const handleGameOver = (result) => {
    setTimeout(() => {
      if (result === "won") {
        setIsModalOpen([true, "won"]);
        // Trigger the new advanced confetti animation
        handleConfetti();
      } else if (result === "lost") {
        setIsModalOpen([true, "lost"]);
      }
    }, 1500);
  };

  const handleShare = async () => {
    if (game.guesses.length === 0) return;

    const grid = game.guesses
      .map((guess) => {
        const splitSolution = game.targetWord.toLowerCase().split("");
        const splitGuess = guess.toLowerCase().split("");
        const statuses = Array(5).fill("⬛");

        // 1. Green Pass
        splitGuess.forEach((char, i) => {
          if (char === splitSolution[i]) {
            statuses[i] = "🟩";
            splitSolution[i] = null;
          }
        });

        // 2. Yellow Pass
        splitGuess.forEach((char, i) => {
          if (statuses[i] !== "🟩") {
            const idx = splitSolution.indexOf(char);
            if (idx !== -1) {
              statuses[i] = "🟨";
              splitSolution[idx] = null;
            }
          }
        });
        return statuses.join("");
      })
      .join("\n");

    const score = game.gameState === "won" ? game.guesses.length : "X";
    const shareText = `MVHMDLE DAILY ${score}/6\n\n${grid}\n\nStreak: ${game.streak}${game.streak > 3 ? " 🔥" : ""}`;

    try {
      await navigator.clipboard.writeText(shareText);
      addToast("Copied!", "success");
    } catch (err) {
      console.log(err);
      addToast("Failed to copy", "error");
    }
  };

  // --- DEBUG RESET FUNCTION ---
  const handleDebugReset = (e) => {
    e.target.blur(); // Remove focus
    const keys = [
      `wordle-guesses-${mode}`,
      `wordle-letters-${mode}`,
      `wordle-state-${mode}`,
      `wordle-last-played-${mode}`,
    ];
    keys.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <Toast toasts={toasts} />

      {/* Header with Streak */}
      <div className="flex-1 center flex-col">
        <Header
          mode="DAILY CHALLENGE"
          streak={game.streak > 3 ? `${game.streak} 🔥` : game.streak}
        />
      </div>

      {/* Game Board */}
      <div className="flex-6 flex justify-center items-center">
        <div className="w-96">
          <Tiles
            guesses={game.guesses}
            turn={game.turn}
            targetWord={game.targetWord}
            gameState={game.gameState}
            onGuessSubmit={(g) => game.submitGuess(g, handleGameOver)}
            onGameOver={(res) => {
              if (res === "won-already" || res === "lost-already") {
                setIsModalOpen([true, game.gameState]);
              }
            }}
            addToast={addToast}
          />
        </div>
      </div>

      {/* Keyboard */}
      <div className="flex-5 center shrink-0 mb-4">
        <Keyboard letters={game.letters} lastChanged={game.lastChanged} />
      </div>

      {/* DEBUG BUTTON */}
      <button
        onClick={handleDebugReset}
        className="absolute bottom-4 right-4 bg-red-600/20 hover:bg-red-600 text-white/50 hover:text-white text-[10px] font-bold py-2 px-3 rounded-lg border border-red-600/30 transition-all z-50 uppercase tracking-widest"
      >
        Reset Daily
      </button>

      {/* Modals */}
      <DailyGameModals
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen([false, isModalOpen[1]]);
          document.activeElement.blur();
          window.focus();
        }}
        onShare={handleShare}
        stats={{
          targetWord: game.targetWord,
          streak: game.streak,
        }}
      />
    </div>
  );
}
