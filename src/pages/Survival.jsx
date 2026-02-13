import { useState, useEffect } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import Modal from "../components/Modal";
import confetti from "canvas-confetti";
import Shop from "../components/Shop";
import HistoryPanel from "../components/HistoryPanel";
import useSurvivalGame from "../hooks/useSurvivalGame";

const DEFAULT_HINTS = {
  "Hide a Letter": {
    cost: 500,
    bought: 0,
    desc: "Discard 1 incorrect key.",
  },
  "Vowel Letter": { cost: 500, bought: 0, desc: "Locate a hidden vowel." },
  "Yellow Letter": { cost: 500, bought: 0, desc: "Find a misplaced key." },
  "Green Letter": { cost: 800, bought: 0, desc: "Confirm a correct spot." },
  Row: { cost: 1200, bought: 0, desc: "+1 Survival Attempt." },
  Heart: { cost: 2000, bought: 0, desc: "+1 Extra Life." },
  "Beat The Game": { cost: 999999, bought: 0, desc: "Instant Extraction." },
};

export default function Survival({ mode = "survival" }) {
  const [gameResetKey, setGameResetKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState([false, "playing"]);

  const {
    targetWord,
    guesses,
    turn,
    gameState,
    letters,
    lastChanged,
    changeColor,
    submitGuess,
    resetGame,
    undoLastGuess,
  } = useSurvivalGame(mode);

  const STREAK_KEY = `wordle-streak-${mode}`;
  const HEARTS_KEY = `wordle-hearts-${mode}`;
  const CURRENCY_KEY = `wordle-shop-currency`;
  const SHOP_DATA_KEY = `wordle-shop-data`;
  const HINTS_USED_KEY = `wordle-hints-used-${mode}`;
  const HINT_HISTORY_KEY = `wordle-hint-history-${mode}`;
  const LAST_REWARD_KEY = `wordle-last-reward-${mode}`;

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem(CURRENCY_KEY);
    return saved ? parseInt(saved) : 2500;
  });

  const [hintsArray, setHintsArray] = useState(() => {
    const saved = localStorage.getItem(SHOP_DATA_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...DEFAULT_HINTS };
      Object.keys(merged).forEach((key) => {
        if (parsed[key]) merged[key].bought = parsed[key].bought;
      });
      return merged;
    }
    return JSON.parse(JSON.stringify(DEFAULT_HINTS));
  });

  const [hintsUsedInRound, setHintsUsedInRound] = useState(() => {
    const saved = localStorage.getItem(HINTS_USED_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [hintHistory, setHintHistory] = useState(() => {
    const saved = localStorage.getItem(HINT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [hearts, setHearts] = useState(() => {
    const saved = localStorage.getItem(HEARTS_KEY);
    return saved ? parseInt(saved) : 3;
  });

  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem(STREAK_KEY);
    return savedStreak ? parseInt(savedStreak) : 0;
  });

  const [lastReward, setLastReward] = useState(() => {
    const saved = localStorage.getItem(LAST_REWARD_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(
    () => localStorage.setItem(CURRENCY_KEY, currency.toString()),
    [currency, CURRENCY_KEY],
  );
  useEffect(
    () => localStorage.setItem(SHOP_DATA_KEY, JSON.stringify(hintsArray)),
    [hintsArray, SHOP_DATA_KEY],
  );
  useEffect(
    () =>
      localStorage.setItem(HINTS_USED_KEY, JSON.stringify(hintsUsedInRound)),
    [hintsUsedInRound, HINTS_USED_KEY],
  );
  useEffect(
    () => localStorage.setItem(HINT_HISTORY_KEY, JSON.stringify(hintHistory)),
    [hintHistory, HINT_HISTORY_KEY],
  );
  useEffect(
    () => localStorage.setItem(HEARTS_KEY, hearts.toString()),
    [hearts, HEARTS_KEY],
  );
  useEffect(
    () => localStorage.setItem(STREAK_KEY, streak.toString()),
    [streak, STREAK_KEY],
  );
  useEffect(() => {
    if (lastReward) {
      localStorage.setItem(LAST_REWARD_KEY, JSON.stringify(lastReward));
    } else {
      localStorage.removeItem(LAST_REWARD_KEY);
    }
  }, [lastReward, LAST_REWARD_KEY]);

  // --- Helpers for Resetting ---
  const handleResetWrapper = () => {
    document.activeElement.blur();
    window.focus();
    resetGame();
    setHintsUsedInRound({});
    setHintHistory([]);
    setLastReward(null);
    setGameResetKey((prev) => prev + 1);
    setIsModalOpen([false, "playing"]);
  };

  const handleFullReset = () => {
    // 1. Force Clear LocalStorage
    localStorage.removeItem(STREAK_KEY);
    localStorage.removeItem(HEARTS_KEY);
    localStorage.removeItem(CURRENCY_KEY);
    localStorage.removeItem(SHOP_DATA_KEY);
    localStorage.removeItem(HINTS_USED_KEY);
    localStorage.removeItem(HINT_HISTORY_KEY);
    localStorage.removeItem(LAST_REWARD_KEY);

    // 2. Reset React State
    setStreak(0);
    setHearts(3);
    setCurrency(2500);
    setHintsArray(JSON.parse(JSON.stringify(DEFAULT_HINTS)));

    // 3. Reset Game
    handleResetWrapper();
  };

  const handleContinue = () => {
    handleResetWrapper(); // Keep streak/hearts, just new word
  };

  // --- Game Over Logic ---
  const handleGameOver = (result, guessCount) => {
    if (result === "won") {
      const unusedRows = 6 - guessCount;
      const BASE_WIN = 5000;
      const SPEED_BONUS = unusedRows * 1500;
      const STREAK_BONUS = (streak + 1) * 200;
      const totalEarned = BASE_WIN + SPEED_BONUS + STREAK_BONUS;

      setCurrency((prev) => prev + totalEarned);
      setLastReward({
        total: totalEarned,
        breakdown: {
          base: BASE_WIN,
          speed: SPEED_BONUS,
          streak: STREAK_BONUS,
          unusedCount: unusedRows,
        },
      });

      setTimeout(() => {
        setStreak((prev) => prev + 1);
        setIsModalOpen([true, "won"]);
        handleConfetti();
      }, 1500);
    } else if (result === "lost") {
      // Wait for tiles animation to finish (approx 2s) before reducing heart and showing modal
      setTimeout(() => {
        const newHearts = hearts - 1;
        setHearts(newHearts);
        setStreak(0); // Reset streak on loss

        if (newHearts <= 0) {
          // All hearts lost -> Game Over
          setIsModalOpen([true, "game-over"]);
        } else {
          // Hearts remaining -> Lost Heart
          setIsModalOpen([true, "lost-heart"]);
        }
      }, 2000);
    } else if (result === "won-already") {
      setIsModalOpen([true, "won"]);
    } else if (result === "lost-already") {
      // Re-open correct modal based on current hearts
      if (hearts <= 0) setIsModalOpen([true, "game-over"]);
      else setIsModalOpen([true, "lost-heart"]);
    }
    document.activeElement.blur();
    window.focus();
  };

  const handleBuyHint = (name, cost) => {
    if (currency < cost) return;
    const usedCount = hintsUsedInRound[name] || 0;
    if (name === "Hide a Letter" && usedCount >= 5) return;
    if (
      ["Green Letter", "Yellow Letter", "Vowel Letter", "Row"].includes(name) &&
      usedCount >= 1
    )
      return;

    let success = false;
    let logMsg = "";

    if (name === "Heart") {
      setHearts((h) => h + 1);
      success = true;
      logMsg = "Bought Extra Life (+1 ❤️)";
    } else if (name === "Row") {
      if (undoLastGuess()) {
        logMsg = "Recovered 1 Attempt!";
        success = true;
      }
    } else {
      const solutionArr = targetWord.toLowerCase().split("");
      if (name === "Green Letter") {
        let unknownIndices = [];
        solutionArr.forEach((_, i) => {
          let known = false;
          guesses.forEach((g) => {
            if (g[i] === solutionArr[i]) known = true;
          });
          if (!known) unknownIndices.push(i);
        });
        if (unknownIndices.length > 0) {
          const revealIdx =
            unknownIndices[Math.floor(Math.random() * unknownIndices.length)];
          const char = solutionArr[revealIdx];
          logMsg = `Position ${revealIdx + 1} is '${char.toUpperCase()}'`;
          changeColor("bg-gameGreen", char);
          success = true;
        } else success = true;
      } else if (name === "Yellow Letter") {
        const candidates = solutionArr.filter(
          (c) =>
            !letters[c].color.includes("bg-gameGreen") &&
            !letters[c].color.includes("bg-gameYellow"),
        );
        if (candidates.length > 0) {
          const char =
            candidates[Math.floor(Math.random() * candidates.length)];
          logMsg = `Word contains '${char.toUpperCase()}'`;
          changeColor("bg-gameYellow", char);
          success = true;
        } else success = true;
      } else if (name === "Hide a Letter") {
        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        const candidates = alphabet.filter(
          (c) =>
            !solutionArr.includes(c) &&
            !letters[c].color.includes("bg-gameGrey"),
        );
        if (candidates.length > 0) {
          const char =
            candidates[Math.floor(Math.random() * candidates.length)];
          changeColor("bg-gameGrey", char);
          logMsg = `Removed: ${char.toUpperCase()}`;
          success = true;
        } else success = true;
      } else if (name === "Vowel Letter") {
        const vowels = ["a", "e", "i", "o", "u"];
        const present = vowels.filter((v) => targetWord.includes(v));
        if (present.length > 0)
          logMsg = `Contains: ${present[0].toUpperCase()}`;
        else logMsg = "No vowels in word!";
        success = true;
      } else if (name === "Beat The Game") {
        logMsg = `Word was: ${targetWord}`;
        success = true;
      }
    }

    if (success) {
      setCurrency((prev) => prev - cost);
      setHintsArray((prev) => ({
        ...prev,
        [name]: { ...prev[name], bought: (prev[name].bought || 0) + 1 },
      }));
      setHintsUsedInRound((prev) => ({
        ...prev,
        [name]: (prev[name] || 0) + 1,
      }));
      if (name !== "Heart") {
        setHintHistory((prev) => [
          ...prev,
          { name, msg: logMsg, time: Date.now() },
        ]);
      }
    }
  };

  function handleConfetti() {
    const end = Date.now() + 3 * 1000;
    const colors = ["#ed143d", "#3498db", "#ffd500", "#00e196"];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 75,
        startVelocity: 60,
        origin: { x: 0, y: 0.75 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 75,
        startVelocity: 60,
        origin: { x: 1, y: 0.75 },
        colors: colors,
      });
      requestAnimationFrame(frame);
    };
    frame();
  }

  async function shareGame() {
    if (guesses.length === 0) return;
    const grid = guesses
      .map((guess) => {
        const splitSolution = targetWord.toLowerCase().split("");
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
            const index = splitSolution.indexOf(char);
            if (index !== -1) {
              statuses[i] = "🟨";
              splitSolution[index] = null;
            }
          }
        });
        return statuses.join("");
      })
      .join("\n");

    const score = isModalOpen[1] === "won" ? guesses.length : "X";

    let shareText = `MVHMDLE ${mode.toUpperCase()} ${score}/6\n\n${grid}`;

    if (isModalOpen[1] === "won") {
      shareText += `\n\nStreak: ${streak} ${streak >= 3 ? "🔥" : ""}`;
      if (lastReward) {
        shareText += `\n+$${lastReward.total.toLocaleString()} | Total: $${currency.toLocaleString()} 💰`;
      } else {
        shareText += `\nTotal: $${currency.toLocaleString()} 💰`;
      }
    } else {
      shareText += `\n\nTotal: $${currency.toLocaleString()} 💰`;
    }

    await navigator.clipboard.writeText(shareText);
  }
  // --- Dynamic Modal Content Logic ---
  const getModalContent = () => {
    // 1. WON
    if (isModalOpen[1] === "won") {
      return {
        title: "You Won",
        content: lastReward ? (
          <div className="flex gap-2 w-full mt-4">
            <div className="bg-[#0a0a0a] text-gameGreen border-2 border-gameGreen/30 rounded-xl w-1/3 flex flex-col items-center justify-center p-2 shadow-lg">
              <span className="text-6xl font-bold">{streak}</span>
              <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest mt-2 text-center">
                Streak
              </span>
            </div>
            <div className="bg-[#0a0a0a] border-2 border-gameGreen/30 rounded-xl flex-1 p-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-white/10 pb-2 mb-2 relative z-10">
                <span className="text-sm font-bold text-white/60 uppercase tracking-wider">
                  Earnings
                </span>
                <span className="text-2xl font-black text-gameGreen drop-shadow-[0_0_8px_rgba(0,255,100,0.5)]">
                  +${lastReward.total.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono text-white/80">
                  <span>Win Bonus</span>
                  <span>+{lastReward.breakdown.base}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-white/80">
                  <span>
                    Guesses Not Used ({lastReward.breakdown.unusedCount})
                  </span>
                  <span>+{lastReward.breakdown.speed}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-white/80">
                  <span>Streak Bonus</span>
                  <span>+{lastReward.breakdown.streak}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-3xl text-center">Your Current Streak: {streak}</p>
        ),
        footer: null, // Use default
      };
    }

    // 2. LOST A HEART (Alive)
    if (isModalOpen[1] === "lost-heart") {
      return {
        title: "You Lost a Heart",
        content: (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl">You didn't guess the word.</p>
            <p className="text-4xl font-bold text-gameDark">
              "{targetWord.toUpperCase()}"
            </p>
            <div className="flex gap-2 mt-4">
              {[...Array(hearts)].map((_, i) => (
                <span key={i} className="text-3xl text-red-500">
                  ❤️
                </span>
              ))}
              {[...Array(3 - hearts)].map((_, i) => (
                <span key={i} className="text-3xl text-gray-400 grayscale">
                  🖤
                </span>
              ))}
            </div>
          </div>
        ),
        footer: (
          <div className="flex gap-4 w-full">
            <button
              onClick={handleFullReset}
              className="w-full bg-red-500 hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg uppercase"
            >
              Give Up
            </button>
            <button
              onClick={handleContinue}
              className="w-full bg-gameYellow hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gameGreen/10 uppercase"
            >
              Continue
            </button>
          </div>
        ),
      };
    }

    // 3. GAME OVER (Dead)
    if (isModalOpen[1] === "game-over") {
      return {
        title: "Game Over",
        content: (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xl">You ran out of hearts!</p>
            <p className="text-sm text-gray-500">The word was:</p>
            <p className="text-4xl font-bold text-gameDark">
              "{targetWord.toUpperCase()}"
            </p>
            {/* Updated Final Streak Box Style */}
            <div className="bg-[#0a0a0a] text-gameRed border-2 border-gameGreen/30 rounded-xl aspect-square flex flex-col items-center justify-center p-3 shadow-lg mt-2">
              <span className="text-5xl font-black">{streak}</span>
              <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest mt-2">
                Final Streak
              </span>
            </div>
          </div>
        ),
        footer: (
          <div className="w-full">
            <button
              onClick={handleFullReset}
              className="w-full bg-gameRed hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg uppercase"
            >
              Start Over
            </button>
          </div>
        ),
      };
    }

    return { title: "", content: null, footer: null };
  };

  const modalData = getModalContent();

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <div className="flex-1 center flex-col">
        <Header
          mode={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`}
          streak={streak}
        />
      </div>
      <div className="flex-6 flex justify-center items-center">
        <div className="w-1/2 max-w-92 h-full center">
          <Shop
            currency={currency}
            hintsArray={hintsArray}
            onBuyHint={handleBuyHint}
            hintsUsedInRound={hintsUsedInRound}
            hasGuesses={guesses.length > 0}
          />
        </div>
        <div className="w-1/2 max-w-92 h-full center">
          <Tiles
            key={gameResetKey}
            guesses={guesses}
            turn={turn}
            targetWord={targetWord}
            gameState={gameState}
            onGuessSubmit={(g) => submitGuess(g, handleGameOver)}
            onGameOver={handleGameOver}
          />
        </div>
        <div className="w-1/2 max-w-92 hidden lg:block h-72">
          <HistoryPanel history={hintHistory} hearts={hearts} />
        </div>
      </div>
      <div className="flex-5 center shrink-0 mb-4">
        <Keyboard letters={letters} lastChanged={lastChanged} />
      </div>

      <Modal
        isOpen={isModalOpen[0]}
        onClose={() => setIsModalOpen([false, isModalOpen[1]])}
        onNext={() => {
          setIsModalOpen([false, isModalOpen[1]]);
          setTimeout(() => handleResetWrapper(), 230);
        }}
        onShare={shareGame}
        title={modalData.title}
        footer={modalData.footer}
      >
        {modalData.content}
      </Modal>
    </div>
  );
}
