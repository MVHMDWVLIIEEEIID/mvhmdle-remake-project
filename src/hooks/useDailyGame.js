import { useState, useEffect, useMemo } from "react";
import data from "../data/words.json";
import { secureStorage } from "../utils/secureStorage"; // [NEW] Import

// Initial Keyboard State
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

export default function useDailyGame(mode = "daily") {
  // Keys
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const GUESSES_KEY = `wordle-guesses-${mode}`;
  const GAME_STATE_KEY = `wordle-state-${mode}`;
  const LAST_PLAYED_KEY = `wordle-last-played-${mode}`;
  const STREAK_KEY = `wordle-daily-streak-${mode}`;

  // Date Logic
  const todayString = useMemo(() => new Date().toDateString(), []);

  // --- Word Selection Logic ---
  const solutionWords = data.slice(0, 2314);

  const getDailyIndex = () => {
    const epoch = new Date("2024-01-01T00:00:00").setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const daysPassed = Math.round((today - epoch) / (1000 * 60 * 60 * 24));
    return Math.abs(daysPassed % solutionWords.length);
  };

  const targetWord = solutionWords[getDailyIndex()];

  // --- Lazy State Initialization with Encryption ---

  const [guesses, setGuesses] = useState(() => {
    // [UPDATED] Use secureStorage.getItem
    const savedDate = secureStorage.getItem(LAST_PLAYED_KEY, null);
    if (savedDate === todayString) {
      return secureStorage.getItem(GUESSES_KEY, []);
    }
    return [];
  });

  const [gameState, setGameState] = useState(() => {
    // [UPDATED] Use secureStorage.getItem
    const savedDate = secureStorage.getItem(LAST_PLAYED_KEY, null);
    if (savedDate === todayString) {
      return secureStorage.getItem(GAME_STATE_KEY, "playing");
    }
    return "playing";
  });

  const [letters, setLetters] = useState(() => {
    // [UPDATED] Use secureStorage.getItem
    const savedDate = secureStorage.getItem(LAST_PLAYED_KEY, null);
    if (savedDate === todayString) {
      return secureStorage.getItem(LETTERS_KEY, getInitialLetters());
    }
    return getInitialLetters();
  });

  const [streak, setStreak] = useState(() => {
    // [UPDATED] Use secureStorage.getItem
    const savedDate = secureStorage.getItem(LAST_PLAYED_KEY, null);
    // Note: secureStorage handles type parsing, so we don't need parseInt
    const savedStreak = secureStorage.getItem(STREAK_KEY, 0);

    if (savedDate === todayString) return savedStreak;

    if (savedDate) {
      const lastDate = new Date(savedDate);
      const currentToday = new Date();
      lastDate.setHours(0, 0, 0, 0);
      currentToday.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (currentToday - lastDate) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff > 1) return 0;
      return savedStreak;
    }
    return 0;
  });

  const [lastChanged, setLastChanged] = useState({
    letter: null,
    timestamp: 0,
  });

  // [NEW] Console log for target word
  useEffect(() => {
    console.log(`[DAILY MODE] Target Word: ${targetWord?.toUpperCase()}`);
  }, [targetWord]);

  // --- Persistence with Encryption ---
  useEffect(() => {
    // [UPDATED] Replace localStorage.setItem with secureStorage.setItem
    secureStorage.setItem(LAST_PLAYED_KEY, todayString);
    secureStorage.setItem(GUESSES_KEY, guesses);
    secureStorage.setItem(LETTERS_KEY, letters);
    secureStorage.setItem(GAME_STATE_KEY, gameState);
    secureStorage.setItem(STREAK_KEY, streak);
  }, [
    guesses,
    letters,
    gameState,
    streak,
    todayString,
    LAST_PLAYED_KEY,
    GUESSES_KEY,
    LETTERS_KEY,
    GAME_STATE_KEY,
    STREAK_KEY,
  ]);

  // --- Game Logic (Unchanged) ---
  const getGuessStatuses = (guessStr) => {
    const solution = targetWord.toLowerCase();
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
        const idx = splitSolution.indexOf(char);
        if (idx !== -1) {
          statuses[i] = "bg-gameYellow";
          splitSolution[idx] = null;
        }
      }
    });
    return statuses;
  };

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

  const submitGuess = (guess, onGameOverCallback) => {
    if (gameState !== "playing") return false;

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);

    const statuses = getGuessStatuses(guess);
    guess.split("").forEach((char, i) => {
      setTimeout(() => changeColor(statuses[i], char), i * 150 + 300);
    });

    if (guess === targetWord.toLowerCase()) {
      setGameState("won");
      setStreak((s) => s + 1);
      if (onGameOverCallback) onGameOverCallback("won");
    } else if (newGuesses.length >= 6) {
      setGameState("lost");
      setStreak(0);
      if (onGameOverCallback) onGameOverCallback("lost");
    }
    return true;
  };

  return {
    targetWord,
    guesses,
    turn: gameState === "won" ? guesses.length - 1 : guesses.length,
    gameState,
    letters,
    lastChanged,
    streak,
    submitGuess,
  };
}
