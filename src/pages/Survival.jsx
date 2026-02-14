import { useState } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import confetti from "canvas-confetti";
import Shop from "../components/Shop";
import HistoryPanel from "../components/HistoryPanel";
import Toast from "../components/Toast";

// Imported Hooks & Components
import useSurvivalGame from "../hooks/useSurvivalGame";
import useSurvivalProgress from "../hooks/useSurvivalProgress";
import SurvivalGameModals from "../components/SurvivalGameModals";

export default function Survival({ mode = "survival" }) {
  const [gameResetKey, setGameResetKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(() => {
    // Check the game state right when the component is created
    if (game.gameState === "won") return [true, "won"];
    if (game.gameState === "lost") {
      return progress.hearts <= 0 ? [true, "game-over"] : [true, "lost-heart"];
    }
    return [false, "playing"];
  });

  // 1. Core Game Logic Hook
  const game = useSurvivalGame(mode);

  // 2. Meta-Game Progress Hook (Shop, Money, Hearts)
  const progress = useSurvivalProgress(mode);

  const addToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const updated = [...prev, { id, msg, type }];
      if (updated.length > 3) return updated.slice(updated.length - 3);
      return updated;
    });
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2500,
    );
  };

  // --- Actions ---

  const handleResetWrapper = () => {
    // Force Focus to Window
    document.activeElement.blur();
    window.focus();

    game.resetGame();
    progress.resetRoundInfo();
    setGameResetKey((prev) => prev + 1);
    progress.setGamesPlayed((prev) => prev + 1);
    setIsModalOpen([false, "playing"]);
  };

  const handleFullReset = () => {
    // Force Focus to Window
    document.activeElement.blur();
    window.focus();

    progress.resetAllProgress();
    handleResetWrapper();
  };

  const handleGameOver = (result, guessCount) => {
    // Force Focus to Window (Ensure no stray focus lingers)
    document.activeElement.blur();
    window.focus();

    setTimeout(() => {
      if (result === "won") {
        const unusedRows = 6 - guessCount;
        const BASE_WIN = 5000;
        const SPEED_BONUS = unusedRows * 1500;
        const STREAK_BONUS = (progress.streak + 1) * 200;
        const totalEarned = BASE_WIN + SPEED_BONUS + STREAK_BONUS;

        progress.setCurrency((prev) => prev + totalEarned);
        progress.setLastReward({
          total: totalEarned,
          breakdown: {
            base: BASE_WIN,
            speed: SPEED_BONUS,
            streak: STREAK_BONUS,
            unusedCount: unusedRows,
          },
        });

        progress.setStreak((prev) => prev + 1);
        setIsModalOpen([true, "won"]);
        handleConfetti();
        progress.setHintHistory((prev) => [
          ...prev,
          {
            type: "game-marker",
            result: "won",
            gameCount: progress.gamesPlayed,
          },
        ]);
      } else if (result === "lost") {
        const newHearts = progress.hearts - 1;
        progress.setHearts(newHearts);
        progress.setStreak(0);
        progress.setHintHistory((prev) => [
          ...prev,
          {
            type: "game-marker",
            result: "lost",
            gameCount: progress.gamesPlayed,
          },
        ]);

        if (newHearts <= 0) setIsModalOpen([true, "game-over"]);
        else setIsModalOpen([true, "lost-heart"]);
      }
    }, 1500);

    if (result === "won-already") setIsModalOpen([true, "won"]);
    else if (result === "lost-already") {
      if (progress.hearts <= 0) setIsModalOpen([true, "game-over"]);
      else setIsModalOpen([true, "lost-heart"]);
    }
  };

  const handleBuyHint = (name, cost) => {
    // Force Focus to Window (Critical for Shop buttons)
    document.activeElement.blur();
    window.focus();

    if (progress.currency < cost) {
      addToast("Not enough cash!", "error");
      return;
    }

    // Hint Validation
    const usedCount = progress.hintsUsedInRound[name] || 0;
    if (name === "Hide a Letter" && usedCount >= 5) {
      addToast("Max usage reached!", "error");
      return;
    }
    if (
      ["Green Letter", "Yellow Letter", "Vowel Letter", "Row"].includes(name) &&
      usedCount >= 1
    ) {
      addToast("Already used this round!", "error");
      return;
    }

    let success = false;
    let logMsg = "";

    // Hint Logic
    if (name === "Heart") {
      progress.setHearts((h) => h + 1);
      success = true;
      addToast("Extra Life Purchased ❤️", "success");
    } else if (name === "Row") {
      if (game.undoLastGuess()) {
        logMsg = "Recovered 1 Attempt!";
        success = true;
        addToast("Attempt Recovered!", "success");
      } else addToast("Nothing to undo!", "error");
    } else {
      const solutionArr = game.targetWord.toLowerCase().split("");

      if (name === "Green Letter") {
        let unknownIndices = [];
        solutionArr.forEach((_, i) => {
          let known = false;
          game.guesses.forEach((g) => {
            if (g[i] === solutionArr[i]) known = true;
          });
          if (!known) unknownIndices.push(i);
        });
        if (unknownIndices.length > 0) {
          const revealIdx =
            unknownIndices[Math.floor(Math.random() * unknownIndices.length)];
          const char = solutionArr[revealIdx];
          logMsg = `Position ${revealIdx + 1} is '${char.toUpperCase()}'`;
          game.changeColor("bg-gameGreen", char);
          success = true;
          addToast(`Revealed: ${char.toUpperCase()}`, "success");
        } else addToast("All letters known!", "info");
      } else if (name === "Yellow Letter") {
        const candidates = solutionArr.filter(
          (c) =>
            !game.letters[c].color.includes("bg-gameGreen") &&
            !game.letters[c].color.includes("bg-gameYellow"),
        );
        if (candidates.length > 0) {
          const char =
            candidates[Math.floor(Math.random() * candidates.length)];
          logMsg = `Word contains '${char.toUpperCase()}'`;
          game.changeColor("bg-gameYellow", char);
          success = true;
          addToast(`Word has: ${char.toUpperCase()}`, "success");
        } else addToast("No hidden yellow letters!", "info");
      } else if (name === "Hide a Letter") {
        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        const candidates = alphabet.filter(
          (c) =>
            !solutionArr.includes(c) &&
            !game.letters[c].color.includes("bg-gameGrey"),
        );
        if (candidates.length > 0) {
          const char =
            candidates[Math.floor(Math.random() * candidates.length)];
          game.changeColor("bg-gameGrey", char);
          logMsg = `Removed: ${char.toUpperCase()}`;
          success = true;
          addToast(`Removed ${char.toUpperCase()}`, "success");
        } else addToast("No more to hide!", "info");
      } else if (name === "Vowel Letter") {
        const vowels = ["a", "e", "i", "o", "u"];
        const present = vowels.filter((v) => game.targetWord.includes(v));
        logMsg =
          present.length > 0
            ? `Contains: ${present[0].toUpperCase()}`
            : "No vowels in word!";
        addToast(
          present.length > 0
            ? `Vowel: ${present[0].toUpperCase()}`
            : "No vowels found!",
          "info",
        );
        success = true;
      } else if (name === "Beat The Game") {
        logMsg = `Word was: ${game.targetWord}`;
        success = true;
        addToast("Game Beaten!", "success");
      }
    }

    // Transaction
    if (success) {
      progress.setCurrency((prev) => prev - cost);
      progress.setHintsArray((prev) => ({
        ...prev,
        [name]: { ...prev[name], bought: (prev[name].bought || 0) + 1 },
      }));
      progress.setHintsUsedInRound((prev) => ({
        ...prev,
        [name]: (prev[name] || 0) + 1,
      }));
      if (name !== "Heart") {
        progress.setHintHistory((prev) => [
          ...prev,
          { name, msg: logMsg, spent: cost, time: Date.now() },
        ]);
      }
    }
  };

  async function shareGame() {
    // Force Focus to Window
    document.activeElement.blur();
    window.focus();

    if (game.guesses.length === 0) return;
    const grid = game.guesses
      .map((guess) => {
        const splitSolution = game.targetWord.toLowerCase().split("");
        const splitGuess = guess.toLowerCase().split("");
        const statuses = Array(5).fill("⬛");
        splitGuess.forEach((char, i) => {
          if (char === splitSolution[i]) {
            statuses[i] = "🟩";
            splitSolution[i] = null;
          }
        });
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
    const score = isModalOpen[1] === "won" ? game.guesses.length : "X";
    const shareText = `MVHMDLE ${mode.toUpperCase()} ${score}/6\n\n${grid}\n\nStreak: ${progress.streak}\nTotal: $${progress.currency.toLocaleString()} 💰`;
    await navigator.clipboard.writeText(shareText);
    addToast("Copied!", "success");
  }

  function handleConfetti() {
    const end = Date.now() + 3000;
    const colors = ["#ed143d", "#3498db", "#ffd500", "#00e196"];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 75,
        origin: { x: 0, y: 0.75 },
        colors,
      });
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
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <Toast toasts={toasts} />
      <div className="flex-1 center flex-col">
        <Header mode={`${mode.toUpperCase()} MODE`} streak={progress.streak} />
      </div>
      <div className="flex-6 flex justify-center items-center gap-6 px-10">
        <div className="w-72">
          <Shop
            currency={progress.currency}
            hintsArray={progress.hintsArray}
            onBuyHint={handleBuyHint}
            hintsUsedInRound={progress.hintsUsedInRound}
            hasGuesses={game.guesses.length > 0}
            gameState={game.gameState}
            isModalOpen={isModalOpen[0]}
          />
        </div>
        <div className="w-96">
          <Tiles
            key={gameResetKey}
            guesses={game.guesses}
            turn={game.turn}
            targetWord={game.targetWord}
            gameState={game.gameState}
            onGuessSubmit={(g) => game.submitGuess(g, handleGameOver)}
            onGameOver={handleGameOver}
            addToast={addToast}
          />
        </div>
        <div className="w-72">
          <HistoryPanel
            history={progress.hintHistory}
            hearts={progress.hearts}
          />
        </div>
      </div>
      <div className="flex-5 center shrink-0 mb-4">
        <Keyboard letters={game.letters} lastChanged={game.lastChanged} />
      </div>

      <SurvivalGameModals
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen([false, isModalOpen[1]]);
          // Force Focus here as well when clicking the "X" button
          document.activeElement.blur();
          window.focus();
        }}
        onNext={() =>
          isModalOpen[1] === "game-over"
            ? handleFullReset()
            : handleResetWrapper()
        }
        onShare={shareGame}
        onFullReset={handleFullReset}
        stats={{
          streak: progress.streak,
          currency: progress.currency,
          gamesPlayed: progress.gamesPlayed,
          hearts: progress.hearts,
          lastReward: progress.lastReward,
          targetWord: game.targetWord,
        }}
      />
    </div>
  );
}
