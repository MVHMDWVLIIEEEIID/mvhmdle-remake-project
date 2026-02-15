import { useState, useEffect, useCallback, useMemo } from "react";
import data from "../data/words.json";
import { secureStorage } from "../utils/secureStorage"; // [NEW] Import

export default function useSurvivalGame(mode) {
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const INDEX_KEY = `wordle-solution-index-${mode}`;
  const INDICES_KEY = `wordle-solution-indices-${mode}`;
  const AVAILABLE_INDICES_KEY = `wordle-available-solution-indices-${mode}`;
  const TILES_GUESSES_KEY = `${mode}-guesses`;
  const TILES_TURN_KEY = `${mode}-turn`;
  const DATE_KEY = `${mode}-date`;
  const MAX_TURNS_KEY = `${mode}-max-turns`;
  const GAME_COUNT_KEY = `wordle-game-count-${mode}`;
  const IS_BOSS_GAME_KEY = `wordle-is-boss-${mode}`;
  const BOSS_WORD_COUNT_KEY = `wordle-boss-word-count-${mode}`;
  const GAME_STATE_KEY = `${mode}-game-state`;

  const getInitialLetters = () => ({
    q: { color: " bg-gameLight ", row: 1 },
    w: { color: " bg-gameLight ", row: 1 },
    e: { color: " bg-gameLight ", row: 1 },
    r: { color: " bg-gameLight ", row: 1 },
    t: { color: " bg-gameLight ", row: 1 },
    y: { color: " bg-gameLight ", row: 1 },
    u: { color: " bg-gameLight ", row: 1 },
    i: { color: " bg-gameLight ", row: 1 },
    o: { color: " bg-gameLight ", row: 1 },
    p: { color: " bg-gameLight ", row: 1 },
    a: { color: " bg-gameLight ", row: 2 },
    s: { color: " bg-gameLight ", row: 2 },
    d: { color: " bg-gameLight ", row: 2 },
    f: { color: " bg-gameLight ", row: 2 },
    g: { color: " bg-gameLight ", row: 2 },
    h: { color: " bg-gameLight ", row: 2 },
    j: { color: " bg-gameLight ", row: 2 },
    k: { color: " bg-gameLight ", row: 2 },
    l: { color: " bg-gameLight ", row: 2 },
    enter: { color: " bg-gameLight ", row: 3, big: true },
    z: { color: " bg-gameLight ", row: 3 },
    x: { color: " bg-gameLight ", row: 3 },
    c: { color: " bg-gameLight ", row: 3 },
    v: { color: " bg-gameLight ", row: 3 },
    b: { color: " bg-gameLight ", row: 3 },
    n: { color: " bg-gameLight ", row: 3 },
    m: { color: " bg-gameLight ", row: 3 },
    back: { color: " bg-gameLight ", row: 3, big: true },
  });

  const SOLUTION_WORD_COUNT = 2315;
  const solutionWords = useMemo(() => data.slice(0, SOLUTION_WORD_COUNT), []);
  const getAllSolutionIndices = useCallback(() => {
    return Array.from({ length: solutionWords.length }, (_, idx) => idx);
  }, [solutionWords.length]);

  const getRandomFromPool = useCallback((pool) => {
    if (!Array.isArray(pool) || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const pickDistinctIndices = useCallback((count, pool = []) => {
    const picked = [];
    const primary = [...pool];

    while (picked.length < count && primary.length > 0) {
      const at = Math.floor(Math.random() * primary.length);
      picked.push(primary.splice(at, 1)[0]);
    }

    return picked;
  }, []);

  // [NEW] Determine game type and word count
  const getGameTypeInfo = (gameCount) => {
    const gameNumber = gameCount + 1;
    if (gameNumber % 10 === 0) {
      // Every 10 games: Boss (4 words)
      return { isBoss: true, bossType: "boss", wordCount: 4 };
    } else if (gameNumber % 5 === 0) {
      // Every 5 games: Boss Rush (2 words)
      return { isBoss: true, bossType: "rush", wordCount: 2 };
    } else {
      // Normal game (1 word)
      return { isBoss: false, bossType: null, wordCount: 1 };
    }
  };

  // [NEW] Get max turns based on game type
  const getMaxTurns = (isBoss, wordCount) => {
    if (isBoss && wordCount === 4) return 9;
    if (isBoss && wordCount === 2) return 7;
    return 6; // Normal game
  };

  // [NEW] Game count state - tracks which game number we're on (must be before maxTurns)
  const [gameCount, setGameCount] = useState(() => {
    return secureStorage.getItem(GAME_COUNT_KEY, 0);
  });

  const [availableSolutionIndices, setAvailableSolutionIndices] = useState(
    () => {
      const saved = secureStorage.getItem(AVAILABLE_INDICES_KEY, null);
      if (
        Array.isArray(saved) &&
        saved.every((idx) => Number.isInteger(idx) && idx >= 0) &&
        saved.length <= solutionWords.length
      ) {
        return saved;
      }
      return getAllSolutionIndices();
    },
  );

  // [NEW] Game type info
  const gameTypeInfo = getGameTypeInfo(gameCount);
  const [isBossGame, setIsBossGame] = useState(() => {
    return secureStorage.getItem(IS_BOSS_GAME_KEY, gameTypeInfo.isBoss);
  });
  const [bossWordCount, setBossWordCount] = useState(() => {
    return secureStorage.getItem(BOSS_WORD_COUNT_KEY, gameTypeInfo.wordCount);
  });

  // [UPDATED] Max Turns State - uses secureStorage
  const [maxTurns, setMaxTurns] = useState(() => {
    const savedMaxTurns = secureStorage.getItem(MAX_TURNS_KEY, null);
    if (savedMaxTurns !== null) return savedMaxTurns; // Return saved value if exists
    // Otherwise, determine based on game type
    const gameTypeInfo = getGameTypeInfo(gameCount);
    return getMaxTurns(gameTypeInfo.isBoss, gameTypeInfo.wordCount);
  });

  // [UPDATED] Random Index(es) - uses secureStorage
  const [random, setRandom] = useState(() => {
    return secureStorage.getItem(
      INDEX_KEY,
      getRandomFromPool(availableSolutionIndices),
    );
  });

  // [NEW] Multiple indices for boss games
  const [randomIndices, setRandomIndices] = useState(() => {
    return secureStorage.getItem(INDICES_KEY, []);
  });

  const targetWords = useMemo(() => {
    if (isBossGame && bossWordCount > 1) {
      return randomIndices.map((idx) => solutionWords[idx]);
    }
    if (random === null || random === undefined) return [];
    return [solutionWords[random]];
  }, [isBossGame, bossWordCount, randomIndices, random, solutionWords]);
  const targetWord = targetWords[0];
  const targetSignature = useMemo(
    () => `${isBossGame ? "boss" : "normal"}:${targetWords.join("|")}`,
    [isBossGame, targetWords],
  );

  // [UPDATED] Guesses - now stores objects with wordIndex
  const [guesses, setGuesses] = useState(() => {
    const savedGuesses = secureStorage.getItem(TILES_GUESSES_KEY, null);
    // For survival games, persist guesses regardless of date (not like daily)
    return savedGuesses ? savedGuesses : [];
  });

  // [UPDATED] Turn - uses secureStorage
  const [turn, setTurn] = useState(() => {
    const savedTurn = secureStorage.getItem(TILES_TURN_KEY, null);
    // For survival games, persist turn regardless of date (not like daily)
    return savedTurn ? savedTurn : 0;
  });

  const [gameState, setGameState] = useState(() => {
    // First, try to load from storage
    const savedGameState = secureStorage.getItem(GAME_STATE_KEY, null);
    if (savedGameState) return savedGameState;

    // If not saved, determine from current game state
    if (!isBossGame) {
      // Normal game - check if the one word is guessed
      const lastGuess = guesses[guesses.length - 1];
      if (
        typeof lastGuess === "string" &&
        lastGuess === targetWord?.toLowerCase()
      )
        return "won";
      if (turn >= maxTurns) return "lost";
    } else {
      // Boss game - check if all words are guessed
      if (guesses.length > 0 && Array.isArray(guesses[0])) {
        const allWordsGuessed = targetWords.every((word) =>
          guesses.some(
            (g) =>
              g.word === word?.toLowerCase() &&
              g.wordIndex === targetWords.indexOf(word),
          ),
        );
        if (allWordsGuessed) return "won";
      }
      if (turn >= maxTurns) return "lost";
    }
    return "playing";
  });

  // [UPDATED] Letters - uses secureStorage
  const [letters, setLetters] = useState(() => {
    return secureStorage.getItem(LETTERS_KEY, getInitialLetters());
  });

  const [lastChanged, setLastChanged] = useState({
    letter: null,
    timestamp: 0,
  });

  // Log only when the actual target assignment changes.
  useEffect(() => {
    if (isBossGame && bossWordCount > 1) {
      console.log(
        `[SURVIVAL BOSS MODE - ${bossWordCount} WORDS] Target Words:`,
        targetWords.map((w) => w?.toUpperCase()),
      );
    } else {
      console.log(`[SURVIVAL MODE] Target Word: ${targetWord?.toUpperCase()}`);
    }
  }, [targetSignature, targetWord, targetWords, isBossGame, bossWordCount]);

  useEffect(() => {
    console.log(`[SURVIVAL MODE] Remaining Solutions: ${availableSolutionIndices.length}`);
  }, [availableSolutionIndices.length]);

  // Persistence with Encryption
  useEffect(() => {
    secureStorage.setItem(MAX_TURNS_KEY, maxTurns);
  }, [maxTurns, MAX_TURNS_KEY]);

  useEffect(() => {
    secureStorage.setItem(GAME_COUNT_KEY, gameCount);
  }, [gameCount, GAME_COUNT_KEY]);

  useEffect(() => {
    secureStorage.setItem(AVAILABLE_INDICES_KEY, availableSolutionIndices);
  }, [availableSolutionIndices, AVAILABLE_INDICES_KEY]);

  useEffect(() => {
    secureStorage.setItem(IS_BOSS_GAME_KEY, isBossGame);
  }, [isBossGame, IS_BOSS_GAME_KEY]);

  useEffect(() => {
    secureStorage.setItem(BOSS_WORD_COUNT_KEY, bossWordCount);
  }, [bossWordCount, BOSS_WORD_COUNT_KEY]);

  useEffect(() => {
    secureStorage.setItem(LETTERS_KEY, letters);
    secureStorage.setItem(INDEX_KEY, random);
  }, [letters, random, LETTERS_KEY, INDEX_KEY]);

  useEffect(() => {
    if (randomIndices.length > 0) {
      secureStorage.setItem(INDICES_KEY, randomIndices);
    }
  }, [randomIndices, INDICES_KEY]);

  useEffect(() => {
    secureStorage.setItem(TILES_GUESSES_KEY, guesses);
    secureStorage.setItem(TILES_TURN_KEY, turn);
  }, [guesses, turn, TILES_GUESSES_KEY, TILES_TURN_KEY]);

  useEffect(() => {
    secureStorage.setItem(GAME_STATE_KEY, gameState);
  }, [gameState, GAME_STATE_KEY]);

  // Initialize randomIndices for boss games if they're missing
  useEffect(() => {
    if (isBossGame && bossWordCount > 1 && randomIndices.length === 0) {
      const newIndices = pickDistinctIndices(
        bossWordCount,
        availableSolutionIndices,
      );
      setRandomIndices(newIndices);
    }
  }, [
    isBossGame,
    bossWordCount,
    randomIndices.length,
    pickDistinctIndices,
    availableSolutionIndices,
  ]);

  const removeSolvedTargetsFromPool = useCallback((indicesToRemove) => {
    if (!Array.isArray(indicesToRemove) || indicesToRemove.length === 0) return;
    const toRemove = new Set(indicesToRemove);
    setAvailableSolutionIndices((prev) =>
      prev.filter((idx) => !toRemove.has(idx)),
    );
  }, []);

  const changeColor = (newColor, letterKey) => {
    const key = letterKey.toLowerCase();
    setLetters((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const currentColor = current.color;
      if (currentColor.includes("bg-gameGreen")) return prev;
      if (
        currentColor.includes("bg-gameYellow") &&
        !newColor.includes("bg-gameGreen")
      )
        return prev;
      if (
        currentColor.includes("bg-gameGrey") &&
        newColor.includes("bg-gameGrey")
      )
        return prev;

      setLastChanged({ letter: key, timestamp: Date.now() });
      return { ...prev, [key]: { ...current, color: newColor } };
    });
  };

  const getGuessStatuses = (guessStr, wordIndex = 0) => {
    const solution = targetWords[wordIndex]?.toLowerCase();
    if (!solution) return Array(5).fill("bg-gameGrey");

    const splitSolution = solution.split("");
    const splitGuess = guessStr.split("");
    const statuses = Array(5).fill("bg-gameGrey");

    splitGuess.forEach((char, i) => {
      if (char === splitSolution[i]) {
        statuses[i] = "bg-gameGreen";
        splitSolution[i] = null;
      }
    });
    splitGuess.forEach((char, i) => {
      if (statuses[i] !== "bg-gameGreen") {
        const indexInSolution = splitSolution.indexOf(char);
        if (indexInSolution !== -1) {
          statuses[i] = "bg-gameYellow";
          splitSolution[indexInSolution] = null;
        }
      }
    });
    return statuses;
  };

  const submitGuess = (guess, _wordIndex, onGameOver) => {
    if (gameState !== "playing") return false;
    if (!targetWord && (!Array.isArray(targetWords) || targetWords.length === 0))
      return false;

    if (isBossGame && bossWordCount > 1) {
      // Boss game with multiple words

      if (bossWordCount === 4) {
        // 4-word Quordle mode: submit same guess to all 4 words at once
        const guessesToAdd = [];
        for (let i = 0; i < 4; i++) {
          // Skip words that are already solved
          const isSolved = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!isSolved) {
            guessesToAdd.push({ word: guess, wordIndex: i, rowNumber: turn });
          }
        }
        const newGuesses = [...guesses, ...guessesToAdd];
        setGuesses(newGuesses);

        // Apply color changes for all 4 words with staggered timing
        for (let i = 0; i < 4; i++) {
          // Skip if already solved
          const isSolved = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!isSolved) {
            const statuses = getGuessStatuses(guess, i);
            guess.split("").forEach((char, j) => {
              setTimeout(() => changeColor(statuses[j], char), j * 150 + 300);
            });
          }
        }

        // Check if all 4 words are solved
        const allWordsGuessed = targetWords.every((word, idx) =>
          newGuesses.some(
            (g) => g.word === word?.toLowerCase() && g.wordIndex === idx,
          ),
        );

        const newlySolved = [];
        for (let i = 0; i < 4; i++) {
          const wasSolvedBefore = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!wasSolvedBefore && guess === targetWords[i]?.toLowerCase()) {
            newlySolved.push(randomIndices[i]);
          }
        }
        removeSolvedTargetsFromPool(newlySolved);

        if (allWordsGuessed) {
          setGameState("won");
          onGameOver("won", newGuesses.length);
        } else {
          // Move to next row
          const newTurn = turn + 1;
          setTurn(newTurn);
          if (newTurn >= maxTurns) {
            setGameState("lost");
            onGameOver("lost", maxTurns);
          }
        }
      } else {
        // 2-word Quordle mode: submit same guess to both words at once
        const guessesToAdd = [];
        for (let i = 0; i < 2; i++) {
          // Skip words that are already solved
          const isSolved = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!isSolved) {
            guessesToAdd.push({ word: guess, wordIndex: i, rowNumber: turn });
          }
        }
        const newGuesses = [...guesses, ...guessesToAdd];
        setGuesses(newGuesses);

        // Apply color changes for both words with staggered timing
        for (let i = 0; i < 2; i++) {
          // Skip if already solved
          const isSolved = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!isSolved) {
            const statuses = getGuessStatuses(guess, i);
            guess.split("").forEach((char, j) => {
              setTimeout(() => changeColor(statuses[j], char), j * 150 + 300);
            });
          }
        }

        // Check if all 2 words are solved
        const allWordsGuessed = targetWords.every((word, idx) =>
          newGuesses.some(
            (g) => g.word === word?.toLowerCase() && g.wordIndex === idx,
          ),
        );

        const newlySolved = [];
        for (let i = 0; i < 2; i++) {
          const wasSolvedBefore = guesses.some(
            (g) =>
              g.word === targetWords[i]?.toLowerCase() && g.wordIndex === i,
          );
          if (!wasSolvedBefore && guess === targetWords[i]?.toLowerCase()) {
            newlySolved.push(randomIndices[i]);
          }
        }
        removeSolvedTargetsFromPool(newlySolved);

        if (allWordsGuessed) {
          setGameState("won");
          onGameOver("won", newGuesses.length);
        } else {
          // Move to next row
          const newTurn = turn + 1;
          setTurn(newTurn);
          if (newTurn >= maxTurns) {
            setGameState("lost");
            onGameOver("lost", maxTurns);
          }
        }
      }
    } else {
      // Normal game with one word
      const newGuesses = [...guesses, guess];
      setGuesses(newGuesses);

      const statuses = getGuessStatuses(guess, 0);
      guess.split("").forEach((char, i) => {
        setTimeout(() => changeColor(statuses[i], char), i * 150 + 300);
      });

      if (guess === targetWord?.toLowerCase()) {
        removeSolvedTargetsFromPool([random]);
        setGameState("won");
        onGameOver("won", newGuesses.length);
      } else {
        const newTurn = turn + 1;
        setTurn(newTurn);
        if (newTurn >= maxTurns) {
          setGameState("lost");
          onGameOver("lost", maxTurns);
        }
      }
    }
    return true;
  };

  const addExtraRow = () => {
    setMaxTurns((prev) => prev + 1);
  };

  const resetGame = () => {
    // [UPDATED] Use secureStorage.removeItem
    secureStorage.removeItem(INDEX_KEY);
    secureStorage.removeItem(INDICES_KEY);
    secureStorage.removeItem(LETTERS_KEY);
    secureStorage.removeItem(TILES_GUESSES_KEY);
    secureStorage.removeItem(TILES_TURN_KEY);
    secureStorage.removeItem(MAX_TURNS_KEY);
    secureStorage.removeItem(IS_BOSS_GAME_KEY);
    secureStorage.removeItem(BOSS_WORD_COUNT_KEY);

    if (availableSolutionIndices.length === 0) {
      setRandom(null);
      setRandomIndices([]);
      setGuesses([]);
      setTurn(0);
      setGameState("won");
      return;
    }

    // Increment game count
    const newGameCount = gameCount + 1;
    const newGameTypeInfo = getGameTypeInfo(newGameCount);

    setGameCount(newGameCount);
    setIsBossGame(newGameTypeInfo.isBoss);
    setBossWordCount(newGameTypeInfo.wordCount);

    let nextIsBoss = newGameTypeInfo.isBoss;
    let nextWordCount = newGameTypeInfo.wordCount;

    if (
      newGameTypeInfo.isBoss &&
      newGameTypeInfo.wordCount > 1 &&
      availableSolutionIndices.length >= newGameTypeInfo.wordCount
    ) {
      // Generate multiple word indices for boss games
      const newIndices = pickDistinctIndices(
        newGameTypeInfo.wordCount,
        availableSolutionIndices,
      );
      setRandomIndices(newIndices);
    } else {
      // Normal game - single word
      const newIndex = getRandomFromPool(availableSolutionIndices);
      setRandom(newIndex);
      setRandomIndices([]);
      nextIsBoss = false;
      nextWordCount = 1;
    }

    setIsBossGame(nextIsBoss);
    setBossWordCount(nextWordCount);

    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGuesses([]);
    setTurn(0);
    setMaxTurns(getMaxTurns(nextIsBoss, nextWordCount));
    setGameState("playing");
  };

  const resetAllGameData = () => {
    // Remove all persisted survival run data.
    [
      LETTERS_KEY,
      INDEX_KEY,
      INDICES_KEY,
      TILES_GUESSES_KEY,
      TILES_TURN_KEY,
      DATE_KEY,
      MAX_TURNS_KEY,
      GAME_COUNT_KEY,
      IS_BOSS_GAME_KEY,
      BOSS_WORD_COUNT_KEY,
      GAME_STATE_KEY,
      AVAILABLE_INDICES_KEY,
    ].forEach((key) => secureStorage.removeItem(key));

    const firstGameTypeInfo = getGameTypeInfo(0);
    const freshPool = getAllSolutionIndices();
    const firstIndex = getRandomFromPool(freshPool);

    setGameCount(0);
    setAvailableSolutionIndices(freshPool);
    setIsBossGame(firstGameTypeInfo.isBoss);
    setBossWordCount(firstGameTypeInfo.wordCount);
    setRandom(firstIndex);
    setRandomIndices([]);
    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGuesses([]);
    setTurn(0);
    setMaxTurns(
      getMaxTurns(firstGameTypeInfo.isBoss, firstGameTypeInfo.wordCount),
    );
    setGameState("playing");
  };

  // Retry current level without advancing game counter.
  // Keeps the same level number (gameCount) and game type.
  const retryCurrentGame = () => {
    // Clear guesses/turn but keep gameCount
    secureStorage.removeItem(INDICES_KEY);
    secureStorage.removeItem(INDEX_KEY);
    secureStorage.removeItem(LETTERS_KEY);
    secureStorage.removeItem(TILES_GUESSES_KEY);
    secureStorage.removeItem(TILES_TURN_KEY);

    let nextIsBoss = isBossGame && bossWordCount > 1;
    let nextWordCount = nextIsBoss ? bossWordCount : 1;

    if (nextIsBoss && availableSolutionIndices.length >= bossWordCount) {
      const newIndices = pickDistinctIndices(
        bossWordCount,
        availableSolutionIndices,
      );
      setRandomIndices(newIndices);
    } else {
      const newIndex = getRandomFromPool(availableSolutionIndices);
      setRandom(newIndex);
      setRandomIndices([]);
      nextIsBoss = false;
      nextWordCount = 1;
    }

    setIsBossGame(nextIsBoss);
    setBossWordCount(nextWordCount);
    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGuesses([]);
    setTurn(0);
    setMaxTurns(getMaxTurns(nextIsBoss, nextWordCount));
    setGameState("playing");
  };

  // Backward-compatible alias for boss retry flow
  const retryBoss = () => {
    retryCurrentGame();
  };

  const undoLastGuess = () => {
    if (guesses.length > 0) {
      setGuesses((prev) => prev.slice(0, -1));
      setTurn((prev) => Math.max(0, prev - 1));
      setGameState("playing");
      return true;
    }
    return false;
  };

  return {
    targetWord,
    targetWords,
    guesses,
    turn,
    maxTurns,
    gameState,
    letters,
    lastChanged,
    changeColor,
    submitGuess,
    resetGame,
    resetAllGameData,
    retryCurrentGame,
    retryBoss,
    undoLastGuess,
    addExtraRow,
    isBossGame,
    bossWordCount,
    gameCount,
    availableSolutionCount: availableSolutionIndices.length,
  };
}
