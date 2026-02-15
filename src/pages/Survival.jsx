import { useState } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import BossTiles from "../components/BossTiles";
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

  // 1. Core Game Logic Hook
  const game = useSurvivalGame(mode);

  // 2. Meta-Game Progress Hook (Shop, Money, Hearts)
  const progress = useSurvivalProgress(mode);

  // Helper function to merge keyboard colors from all words in boss mode
  const getMergedKeyboardLetters = () => {
    if (!game.isBossGame || game.bossWordCount <= 1) {
      return game.letters;
    }

    // For boss games, merge colors from all target words
    // Priority: Green > Yellow > Grey
    const merged = JSON.parse(JSON.stringify(game.letters));

    game.targetWords.forEach((targetWord, wordIdx) => {
      if (!targetWord) return;

      const word = targetWord.toLowerCase();
      word.split("").forEach((char) => {
        if (!merged[char]) return;

        const charGuesses = game.guesses.filter(
          (g) => g.wordIndex === wordIdx && g.word.includes(char),
        );
        if (charGuesses.length === 0) return;

        const lastGuess = charGuesses[charGuesses.length - 1];
        const solution = targetWord.toLowerCase();
        const guessStr = lastGuess.word.toLowerCase();

        // Check if char is in correct position
        let foundGreen = false;
        for (let i = 0; i < guessStr.length; i++) {
          if (guessStr[i] === char && solution[i] === char) {
            foundGreen = true;
            break;
          }
        }

        if (foundGreen) {
          merged[char].color = " bg-gameGreen ";
        } else {
          // Check if char is in word but wrong position
          if (
            solution.includes(char) &&
            !merged[char].color.includes("bg-gameGreen")
          ) {
            if (!merged[char].color.includes("bg-gameYellow")) {
              merged[char].color = " bg-gameYellow ";
            }
          }
        }
      });
    });

    return merged;
  };

  const keyboardLetters = getMergedKeyboardLetters();

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

  // --- Actions ---

  const handleResetWrapper = () => {
    document.activeElement.blur();
    window.focus();

    game.resetGame();
    progress.resetRoundInfo();
    setGameResetKey((prev) => prev + 1);
    progress.setGamesPlayed((prev) => prev + 1);
    setIsModalOpen([false, "playing"]);
  };

  // Retry the boss attempt without advancing the game counter
  const handleRetryBoss = () => {
    document.activeElement.blur();
    window.focus();

    if (game.isBossGame) {
      game.retryBoss();
      progress.resetRoundInfo();
      setGameResetKey((prev) => prev + 1);
      // Do NOT increment gamesPlayed here because this is a retry of the same run
      setIsModalOpen([false, "playing"]);
    } else {
      // fallback to normal reset
      handleResetWrapper();
    }
  };

  const handleFullReset = () => {
    document.activeElement.blur();
    window.focus();

    progress.resetAllProgress();
    handleResetWrapper();
  };

  const handleGameOver = (result, guessCount) => {
    document.activeElement.blur();
    window.focus();

    setTimeout(() => {
      if (result === "won") {
        const unusedRows = game.maxTurns - guessCount;
        // Boss game earnings (if applicable) or regular winnings
        let BASE_WIN = 3000;
        let bossBase = 0;
        let bossBonus = 0;

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
            STREAK_BONUS
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
      progress.setHearts((h) => h + 1);
      success = true;
      addToast("Extra Life Purchased ❤️", "success");
    } else if (name === "Row") {
      game.addExtraRow();
      success = true;
      logMsg = "Added Extra Row!";
      addToast("Row Added!", "success");
    } else if (name === "Beat The Game") {
      // [NEW] Logic for beating the game
      success = true;
      logMsg = "GAME BEATEN!";
      // Trigger special confetti and modal
      const end = Date.now() + 5000;
      const colors = ["#FFFFFF", "#FFD700", "#FF0000", "#00FF00", "#0000FF"];
      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();

      setIsModalOpen([true, "victory"]);
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
        return wordGuesses
          .map((guessObj) => {
            const splitSolution = word.toLowerCase().split("");
            const splitGuess = guessObj.word.toLowerCase().split("");
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
      });
      const allGrids = gridsByWord.join("\n---\n");
      const shareText = `MVHMDLE ${mode.toUpperCase()} BOSS (${game.bossWordCount} words)\n\n${allGrids}\n\nStreak: ${progress.streak}\nTotal: $${progress.currency.toLocaleString()} 💰`;
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
      const shareText = `MVHMDLE ${mode.toUpperCase()} ${score}/${game.maxTurns}\n\n${grid}\n\nStreak: ${progress.streak}\nTotal: $${progress.currency.toLocaleString()} 💰`;
      await navigator.clipboard.writeText(shareText);
    }
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
        <Header
          mode={`${mode.toUpperCase()} MODE`}
          streak={progress.streak}
          hearts={progress.hearts}
        />
      </div>
      <div
        className={`flex-10 flex justify-center items-center gap-6 px-10 overflow-y-auto clean-scroll`}
      >
        {!game.isBossGame && (
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
                game.submitGuess(g, wordIdx, handleGameOver)
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
              onGuessSubmit={(g) => game.submitGuess(g, 0, handleGameOver)}
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
        <Keyboard letters={keyboardLetters} lastChanged={game.lastChanged} />
      </div>

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
          // If player lost a boss attempt but still has hearts, retry boss
          if (modalType === "lost-heart" && game.isBossGame)
            return handleRetryBoss();
          return handleResetWrapper();
        }}
        onShare={shareGame}
        onFullReset={handleFullReset}
        stats={{
          streak: progress.streak,
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
    </div>
  );
}
