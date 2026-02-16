import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import BossKeyboard from "../components/BossKeyboard";
import Tiles from "../components/Tiles";
import BossTiles from "../components/BossTiles";
import confetti from "canvas-confetti";
import Shop from "../components/Shop";
import HistoryPanel from "../components/HistoryPanel";
import Toast from "../components/Toast";
import SurvivalGuideCustomModal from "../components/SurvivalGuideCustomModal";
import { secureStorage } from "../utils/secureStorage";
import SurvivalVictoryStats from "../components/SurvivalVictoryStats";

// Imported Hooks & Components
import useSurvivalGame from "../hooks/useSurvivalGame";
import useSurvivalProgress from "../hooks/useSurvivalProgress";
import SurvivalGameModals from "../components/SurvivalGameModals";

export default function Survival({ mode = "survival" }) {
  const navigate = useNavigate();
  const RESULT_ANIMATION_MS = 1500;
  const BOSS_KEY_REVEAL_START_MS = 300;
  const BOSS_KEY_REVEAL_STEP_MS = 150;
  const MAX_HEARTS = 5;
  const [gameResetKey, setGameResetKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [bossRevealProgress, setBossRevealProgress] = useState({
    rowNumber: -1,
    revealedCount: 5,
  });
  const [bossKeyboardView, setBossKeyboardView] = useState("all");
  const bossRevealTimersRef = useRef([]);
  const prevBossGuessesLenRef = useRef(0);
  const bossRevealInitializedRef = useRef(false);
  const transitionLockRef = useRef(false);
  const modalReadyAtRef = useRef(0);
  const GUIDE_SEEN_KEY = `wordle-survival-guide-seen-${mode}`;
  const [isGuideOpen, setIsGuideOpen] = useState(() => {
    return !secureStorage.getItem(GUIDE_SEEN_KEY, false);
  });

  // 1. Core Game Logic Hook
  const game = useSurvivalGame(mode);

  // 2. Meta-Game Progress Hook (Shop, Money, Hearts)
  const progress = useSurvivalProgress(mode);

  useEffect(() => {
    if (isGuideOpen) {
      secureStorage.setItem(GUIDE_SEEN_KEY, true);
    }
  }, [isGuideOpen, GUIDE_SEEN_KEY]);

  useLayoutEffect(() => {
    const clearTimers = () => {
      bossRevealTimersRef.current.forEach((t) => clearTimeout(t));
      bossRevealTimersRef.current = [];
    };

    if (!game.isBossGame || game.bossWordCount <= 1) {
      clearTimers();
      setBossRevealProgress({ rowNumber: -1, revealedCount: 5 });
      prevBossGuessesLenRef.current = 0;
      bossRevealInitializedRef.current = false;
      return;
    }

    const currentLen = game.guesses.length;

    // Hydration/refresh path: adopt existing state without replaying animations.
    if (!bossRevealInitializedRef.current) {
      bossRevealInitializedRef.current = true;
      prevBossGuessesLenRef.current = currentLen;
      setBossRevealProgress({ rowNumber: -1, revealedCount: 5 });
      return;
    }

    const prevLen = prevBossGuessesLenRef.current;
    prevBossGuessesLenRef.current = currentLen;

    // Reset/undo path
    if (currentLen <= prevLen || currentLen === 0) {
      clearTimers();
      setBossRevealProgress({ rowNumber: -1, revealedCount: 5 });
      return;
    }

    // New guess added: animate only this newly-added row.
    const latestRowNumber = game.guesses.reduce((max, g) => {
      if (typeof g?.rowNumber === "number") return Math.max(max, g.rowNumber);
      return max;
    }, -1);

    if (latestRowNumber < 0) return;

    clearTimers();
    setBossRevealProgress({ rowNumber: latestRowNumber, revealedCount: 0 });

    let step = 0;
    const startTimer = setTimeout(() => {
      step = 1;
      setBossRevealProgress({ rowNumber: latestRowNumber, revealedCount: 1 });

      const interval = setInterval(() => {
        step += 1;
        if (step > 5) {
          clearInterval(interval);
          setBossRevealProgress({ rowNumber: -1, revealedCount: 5 });
          return;
        }
        setBossRevealProgress({
          rowNumber: latestRowNumber,
          revealedCount: step,
        });
      }, BOSS_KEY_REVEAL_STEP_MS);

      bossRevealTimersRef.current.push(interval);
    }, BOSS_KEY_REVEAL_START_MS);

    bossRevealTimersRef.current.push(startTimer);

    return clearTimers;
  }, [game.guesses, game.isBossGame, game.bossWordCount]);

  useEffect(() => {
    if (!game.isBossGame || game.bossWordCount <= 1) {
      setBossKeyboardView("all");
      return;
    }
    if (
      bossKeyboardView !== "all" &&
      (bossKeyboardView < 0 || bossKeyboardView >= game.bossWordCount)
    ) {
      setBossKeyboardView("all");
    }
  }, [game.isBossGame, game.bossWordCount, bossKeyboardView]);

  const getBossKeyboardLineColors = () => {
    if (!game.isBossGame || game.bossWordCount <= 1) return {};
    const isRevealLocked = bossRevealProgress.rowNumber >= 0;
    const latestRowNumber = bossRevealProgress.rowNumber;
    const revealedCount = bossRevealProgress.revealedCount;
    const visibleWordIndices =
      bossKeyboardView === "all"
        ? Array.from({ length: game.bossWordCount }, (_, idx) => idx)
        : [bossKeyboardView];

    const isLetterRevealedForGuess = (guessObj, letter) => {
      const guess = guessObj.word.toLowerCase();

      if (
        isRevealLocked &&
        typeof guessObj?.rowNumber === "number" &&
        guessObj.rowNumber === latestRowNumber
      ) {
        for (let i = 0; i < Math.min(revealedCount, guess.length); i++) {
          if (guess[i] === letter) return true;
        }
        return false;
      }

      return guess.includes(letter);
    };

    const keyMap = {};
    Object.keys(game.letters).forEach((key) => {
      keyMap[key] = Array(visibleWordIndices.length).fill("bg-gameLight");
    });

    visibleWordIndices.forEach((wordIdx, segmentIdx) => {
      const targetWord = game.targetWords[wordIdx];
      if (!targetWord) return;
      const solution = targetWord.toLowerCase();

      Object.keys(game.letters).forEach((key) => {
        const letter = key.toLowerCase();
        if (!/^[a-z]$/.test(letter)) return;

        const guessesForWord = game.guesses.filter(
          (g) =>
            typeof g?.word === "string" &&
            g.wordIndex === wordIdx &&
            isLetterRevealedForGuess(g, letter),
        );

        if (guessesForWord.length === 0) {
          keyMap[key][segmentIdx] = "bg-gameLight";
          return;
        }

        let hasGreen = false;
        guessesForWord.forEach((guessObj) => {
          const guess = guessObj.word.toLowerCase();
          const maxIdx =
            isRevealLocked &&
            typeof guessObj?.rowNumber === "number" &&
            guessObj.rowNumber === latestRowNumber
              ? Math.min(revealedCount, guess.length)
              : guess.length;

          for (let i = 0; i < maxIdx; i++) {
            if (guess[i] === letter && solution[i] === letter) {
              hasGreen = true;
              break;
            }
          }
        });

        if (hasGreen) {
          keyMap[key][segmentIdx] = "bg-gameGreen";
          return;
        }

        if (solution.includes(letter)) {
          keyMap[key][segmentIdx] = "bg-gameYellow";
        } else {
          keyMap[key][segmentIdx] = "bg-gameGrey";
        }
      });
    });

    return keyMap;
  };

  const bossKeyboardLineColors = getBossKeyboardLineColors();

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

  const [isModalOpen, setIsModalOpen] = useState(() => {
    // Check the game state right when the component is created
    if (game.gameState === "won") return [true, "won"];
    if (game.gameState === "lost") {
      return progress.hearts <= 0 ? [true, "game-over"] : [true, "lost-heart"];
    }
    return [false, "playing"];
  });
  const [streakBeforeLastLoss, setStreakBeforeLastLoss] = useState(0);

  // --- Actions ---

  const withTransitionLock = (fn) => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    fn();
    setTimeout(() => {
      transitionLockRef.current = false;
    }, 400);
  };

  const handleResetWrapper = (advanceLevel = true) => {
    if (transitionLockRef.current) return;
    document.activeElement.blur();
    window.focus();

    withTransitionLock(() => {
      if (advanceLevel) {
        game.resetGame();
      } else {
        game.retryCurrentGame();
      }
      progress.resetRoundInfo();
      setGameResetKey((prev) => prev + 1);
      if (advanceLevel) {
        progress.setGamesPlayed((prev) => prev + 1);
      }
      setIsModalOpen([false, "playing"]);
    });
  };

  // Retry the boss attempt without advancing the game counter
  const handleRetryBoss = () => {
    if (transitionLockRef.current) return;
    document.activeElement.blur();
    window.focus();

    withTransitionLock(() => {
      if (game.isBossGame) {
        game.retryBoss();
        progress.resetRoundInfo();
        setGameResetKey((prev) => prev + 1);
        // Do NOT increment gamesPlayed here because this is a retry of the same run
        setIsModalOpen([false, "playing"]);
      } else {
        game.resetGame();
        progress.resetRoundInfo();
        setGameResetKey((prev) => prev + 1);
        progress.setGamesPlayed((prev) => prev + 1);
        setIsModalOpen([false, "playing"]);
      }
    });
  };

  const handleFullReset = () => {
    if (transitionLockRef.current) return;
    document.activeElement.blur();
    window.focus();

    withTransitionLock(() => {
      progress.resetAllProgress();
      game.resetAllGameData();
      setGameResetKey((prev) => prev + 1);
      setIsModalOpen([false, "playing"]);
    });
  };

  const handleGameOver = (result, guessCount) => {
    document.activeElement.blur();
    window.focus();

    const now = Date.now();

    if (result === "won" || result === "lost") {
      modalReadyAtRef.current = now + RESULT_ANIMATION_MS;
    }

    setTimeout(() => {
      if (result === "won") {
        const solvedWords =
          game.isBossGame && game.bossWordCount > 1 ? game.bossWordCount : 1;
        progress.addWin(solvedWords);
        const unusedRows = game.maxTurns - guessCount;
        // Boss game earnings (if applicable) or regular winnings
        let BASE_WIN = 3000;
        let bossBase = 0;
        let bossBonus = 0;
        let heartAdded = false;
        let heartCashBonus = 0;

        if (game.isBossGame && game.bossWordCount > 1) {
          if (game.bossWordCount === 2) {
            const basePerWord = 5000;
            const bonusIncrement = 2000;
            const prevCount = progress.boss2Count || 0; // times boss 2 was previously beaten
            bossBase = basePerWord * 2; // 5k per word
            bossBonus = bonusIncrement * (1 + prevCount); // initial 2k, stacks by 2k each recurrence
            // persist increment for next time
            progress.setBoss2Count((c) => (c || 0) + 1);
          } else if (game.bossWordCount === 4) {
            const basePerWord = 4000;
            const bonusIncrement = 4000;
            const prevCount = progress.boss4Count || 0;
            bossBase = basePerWord * 4; // 4k per word
            bossBonus = bonusIncrement * (1 + prevCount); // initial 4k bonus, stacks by 4k
            // persist increment for next time
            progress.setBoss4Count((c) => (c || 0) + 1);
            // Reward: +1 heart, or +50k cash if already at max hearts
            heartAdded = progress.hearts < MAX_HEARTS;
            if (heartAdded) {
              progress.setHearts((h) => Math.min(MAX_HEARTS, h + 1));
            } else {
              heartCashBonus = 50000;
            }
          }
        }

        const SPEED_BONUS = unusedRows * 1000;
        const STREAK_BONUS = (progress.streak + 1) * 150;

        const totalEarned = bossBase + bossBonus || BASE_WIN;
        const grandTotal = game.isBossGame
          ? totalEarned +
            2000 *
              (game.bossWordCount === 2
                ? game.boss2Count || 0
                : game.bossWordCount === 4
                  ? game.boss4Count || 0
                  : 0) +
            STREAK_BONUS +
            heartCashBonus
          : totalEarned + SPEED_BONUS + STREAK_BONUS;

        progress.setCurrency((prev) => prev + grandTotal);
        progress.setLastReward({
          total: grandTotal,
          breakdown: {
            base: bossBase || BASE_WIN,
            bonus: bossBonus || 0,
            speed: SPEED_BONUS,
            streak: STREAK_BONUS,
            unusedCount: unusedRows,
            heartAdded,
            heartCashBonus,
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
        setStreakBeforeLastLoss(progress.streak);
        progress.addLoss();
        const newHearts = Math.max(0, progress.hearts - 1);
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
    }, RESULT_ANIMATION_MS);

    if (result === "won-already") {
      if (now < modalReadyAtRef.current) return;
      setIsModalOpen([true, "won"]);
    } else if (result === "lost-already") {
      if (now < modalReadyAtRef.current) return;
      if (progress.hearts <= 0) setIsModalOpen([true, "game-over"]);
      else setIsModalOpen([true, "lost-heart"]);
    }
  };

  const handleBuyHint = (name, cost) => {
    document.activeElement.blur();
    window.focus();

    if (progress.currency < cost) {
      addToast("Not enough cash!", "error");
      return;
    }

    const usedCount = progress.hintsUsedInRound[name] || 0;
    if (name === "Hide a Letter" && usedCount >= 5) {
      addToast("Max usage reached!", "error");
      return;
    }
    if (
      ["Green Letter", "Yellow Letter", "Vowel Letter"].includes(name) &&
      usedCount >= 1
    ) {
      addToast("Already used this round!", "error");
      return;
    }

    let success = false;
    let logMsg = "";

    // Hint Logic
    if (name === "Heart") {
      if (progress.hearts >= MAX_HEARTS) {
        addToast("Hearts are already full!", "info");
        return;
      }
      progress.setHearts((h) => Math.min(MAX_HEARTS, h + 1));
      success = true;
      addToast("Extra Life Purchased ❤️", "success");
    } else if (name === "Row") {
      game.addExtraRow();
      success = true;
      logMsg = "Added Extra Row!";
      addToast("Row Added!", "success");
    } else if (name === "Beat The Game") {
      success = true;
      logMsg = "GAME BEATEN!";
      launchBeatGameConfetti();
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
      }
    }

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
      if (name === "Beat The Game") {
        progress.setRunCompleted(true);
        setIsModalOpen([false, "playing"]);
      }
    }
  };

  async function shareGame() {
    document.activeElement.blur();
    window.focus();

    if (game.guesses.length === 0) return;

    if (game.isBossGame) {
      // Boss game sharing
      const gridsByWord = game.targetWords.map((word, wordIdx) => {
        const wordGuesses = game.guesses.filter((g) => g.wordIndex === wordIdx);
        return wordGuesses.map((guessObj) => {
          const splitSolution = word.toLowerCase().split("");
          const splitGuess = guessObj.word.toLowerCase().split("");
          const statuses = Array(5).fill("\u2B1B");
          splitGuess.forEach((char, i) => {
            if (char === splitSolution[i]) {
              statuses[i] = "\uD83D\uDFE9";
              splitSolution[i] = null;
            }
          });
          splitGuess.forEach((char, i) => {
            if (statuses[i] !== "\uD83D\uDFE9") {
              const idx = splitSolution.indexOf(char);
              if (idx !== -1) {
                statuses[i] = "\uD83D\uDFE8";
                splitSolution[idx] = null;
              }
            }
          });
          return statuses.join("");
        });
      });

      // Horizontal share layout (rows side-by-side across boss words)
      const maxRows = Math.max(0, ...gridsByWord.map((rows) => rows.length));
      const allGrids = Array.from({ length: maxRows }, (_, rowIdx) =>
        gridsByWord
          .map((rows) => rows[rowIdx] || "\u2B1B\u2B1B\u2B1B\u2B1B\u2B1B")
          .join("   "),
      ).join("\n");

      const streakText =
        progress.streak > 3
          ? `${progress.streak} \uD83D\uDD25`
          : `${progress.streak}`;
      const shareText = `[MVHMDLE](https://mvhmdwvliieeeiid.github.io/mvhmdle-remake-project/) ${mode.toUpperCase()} BOSS (${game.bossWordCount} words)\n\n${allGrids}\n\nStreak: ${streakText}\nTotal: $${progress.currency.toLocaleString()} \uD83D\uDCB0`;
      await navigator.clipboard.writeText(shareText);
    } else {
      // Normal game sharing
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
      const shareText = `[MVHMDLE](https://mvhmdwvliieeeiid.github.io/mvhmdle-remake-project/) ${mode.toUpperCase()} ${score}/${game.maxTurns}\n\n${grid}\n\nStreak: ${progress.streak}${progress.streak > 3 ? " 🔥" : ""}\nTotal: $${progress.currency.toLocaleString()} 💰`;
      await navigator.clipboard.writeText(shareText);
    }
    addToast("Copied!", "success");
  }

  function launchBeatGameConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      colors: ["#00e196", "#ffd500", "#3498db", "#ed143d"],
    };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
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

  if (progress.runCompleted) {
    return (
      <SurvivalVictoryStats
        stats={progress.runStats}
        onNewRun={handleFullReset}
        onBackToMenu={() => navigate("/")}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <Toast toasts={toasts} />
      <div className="flex-1 center flex-col">
        <Header
          mode="SURVIVAL CHALLENGE"
          streak={progress.streak}
          hearts={progress.hearts}
          onModeClick={() => navigate("/")}
        />
      </div>
      <div
        className={`flex-10 flex justify-center items-center gap-6 px-10 overflow-y-auto clean-scroll`}
      >
        {!game.isBossGame && (
          <div className="w-72">
            <Shop
              currency={progress.currency}
              hearts={progress.hearts}
              hintsArray={progress.hintsArray}
              onBuyHint={handleBuyHint}
              hintsUsedInRound={progress.hintsUsedInRound}
              hasGuesses={game.guesses.length > 0}
              gameState={game.gameState}
              isModalOpen={isModalOpen[0]}
            />
          </div>
        )}
        <div
          className={game.isBossGame ? "flex-1 flex justify-center" : "w-96"}
        >
          {game.isBossGame ? (
            <BossTiles
              key={gameResetKey}
              guesses={game.guesses}
              turn={game.turn}
              targetWords={game.targetWords}
              gameState={game.gameState}
              onGuessSubmit={(g, wordIdx) =>
                (() => {
                  const accepted = game.submitGuess(g, wordIdx, handleGameOver);
                  if (accepted) progress.addWordsTyped(1);
                  return accepted;
                })()
              }
              onGameOver={handleGameOver}
              addToast={addToast}
              rowCount={game.maxTurns}
            />
          ) : (
            <Tiles
              key={gameResetKey}
              guesses={game.guesses}
              turn={game.turn}
              targetWord={game.targetWord}
              gameState={game.gameState}
              onGuessSubmit={(g) => {
                const accepted = game.submitGuess(g, 0, handleGameOver);
                if (accepted) progress.addWordsTyped(1);
                return accepted;
              }}
              onGameOver={handleGameOver}
              addToast={addToast}
              rowCount={game.maxTurns}
            />
          )}
        </div>
        {!game.isBossGame && (
          <div className="w-72">
            <HistoryPanel history={progress.hintHistory} />
          </div>
        )}
      </div>
      <div className="flex-5 center shrink-0 mb-4">
        {game.isBossGame && game.bossWordCount > 1 ? (
          <BossKeyboard
            letters={game.letters}
            lastChanged={game.lastChanged}
            lineColorsByLetter={bossKeyboardLineColors}
            bossWordCount={game.bossWordCount}
            selectedView={bossKeyboardView}
            onSelectedViewChange={setBossKeyboardView}
          />
        ) : (
          <Keyboard letters={game.letters} lastChanged={game.lastChanged} />
        )}
      </div>

      <button
        onClick={() => {
          setIsGuideOpen(true);
          document.activeElement.blur();
          window.focus();
        }}
        className="absolute bottom-4 left-4 bg-gameBlue/20 hover:bg-gameBlue text-white/50 hover:text-white text-[10px] font-bold py-2 px-3 rounded-lg border border-gameBlue/30 transition-all z-50 uppercase tracking-widest"
      >
        Guide
      </button>

      <SurvivalGameModals
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen([false, isModalOpen[1]]);
          document.activeElement.blur();
          window.focus();
        }}
        onNext={() => {
          const modalType = isModalOpen[1];
          if (modalType === "game-over") return handleFullReset();
          // If player lost but still has hearts, retry same level (do not advance)
          if (modalType === "lost-heart") {
            if (game.isBossGame) return handleRetryBoss();
            return handleResetWrapper(false);
          }
          return handleResetWrapper();
        }}
        onShare={shareGame}
        onFullReset={handleFullReset}
        stats={{
          streak: progress.streak,
          streakBeforeLastLoss,
          currency: progress.currency,
          gamesPlayed: progress.gamesPlayed,
          hearts: progress.hearts,
          lastReward: progress.lastReward,
          targetWord: game.targetWord,
          targetWords: game.targetWords,
          isBossGame: game.isBossGame,
          bossWordCount: game.bossWordCount,
          boss2Count: progress.boss2Count,
          boss4Count: progress.boss4Count,
        }}
      />

      <SurvivalGuideCustomModal
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          document.activeElement.blur();
          window.focus();
        }}
      />
    </div>
  );
}
