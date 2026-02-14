import { useState, useEffect } from "react";
import data from "../data/words.json";
import { secureStorage } from "../utils/secureStorage"; // [NEW] Import

export default function useSurvivalGame(mode) {
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const INDEX_KEY = `wordle-solution-index-${mode}`;
  const TILES_GUESSES_KEY = `${mode}-guesses`;
  const TILES_TURN_KEY = `${mode}-turn`;
  const DATE_KEY = `${mode}-date`;
  const MAX_TURNS_KEY = `${mode}-max-turns`;
  const today = new Date().toDateString();

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

  const solutionWords = data.slice(0, 2314);
  function getRandom() {
    return Math.floor(Math.random() * solutionWords.length);
  }

  // [UPDATED] Max Turns State - uses secureStorage
  const [maxTurns, setMaxTurns] = useState(() => {
    return secureStorage.getItem(MAX_TURNS_KEY, 6);
  });

  // [UPDATED] Random Index - uses secureStorage
  const [random, setRandom] = useState(() => {
    return secureStorage.getItem(INDEX_KEY, getRandom());
  });
  const targetWord = solutionWords[random];

  // [UPDATED] Guesses - uses secureStorage
  const [guesses, setGuesses] = useState(() => {
    const savedDate = secureStorage.getItem(DATE_KEY, null);
    const savedGuesses = secureStorage.getItem(TILES_GUESSES_KEY, null);
    return savedDate === today && savedGuesses ? savedGuesses : [];
  });

  // [UPDATED] Turn - uses secureStorage
  const [turn, setTurn] = useState(() => {
    const savedDate = secureStorage.getItem(DATE_KEY, null);
    const savedTurn = secureStorage.getItem(TILES_TURN_KEY, null);
    return savedDate === today && savedTurn ? savedTurn : 0;
  });

  const [gameState, setGameState] = useState(() => {
    const lastGuess = guesses[guesses.length - 1];
    if (lastGuess === targetWord?.toLowerCase()) return "won";
    if (turn >= maxTurns) return "lost";
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

  // Persistence with Encryption
  useEffect(() => {
    secureStorage.setItem(MAX_TURNS_KEY, maxTurns);
  }, [maxTurns, MAX_TURNS_KEY]);

  useEffect(() => {
    secureStorage.setItem(LETTERS_KEY, letters);
    secureStorage.setItem(INDEX_KEY, random);
  }, [letters, random, LETTERS_KEY, INDEX_KEY]);

  useEffect(() => {
    secureStorage.setItem(TILES_GUESSES_KEY, guesses);
    secureStorage.setItem(TILES_TURN_KEY, turn);
    secureStorage.setItem(DATE_KEY, today);
  }, [guesses, turn, today, TILES_GUESSES_KEY, TILES_TURN_KEY, DATE_KEY]);

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
        const indexInSolution = splitSolution.indexOf(char);
        if (indexInSolution !== -1) {
          statuses[i] = "bg-gameYellow";
          splitSolution[indexInSolution] = null;
        }
      }
    });
    return statuses;
  };

  const submitGuess = (guess, onGameOver) => {
    if (gameState !== "playing") return false;

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);

    const statuses = getGuessStatuses(guess);
    guess.split("").forEach((char, i) => {
      setTimeout(() => changeColor(statuses[i], char), i * 150 + 300);
    });

    if (guess === targetWord.toLowerCase()) {
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
    return true;
  };

  const addExtraRow = () => {
    setMaxTurns((prev) => prev + 1);
  };

  const resetGame = () => {
    // [UPDATED] Use secureStorage.removeItem
    secureStorage.removeItem(INDEX_KEY);
    secureStorage.removeItem(LETTERS_KEY);
    secureStorage.removeItem(TILES_GUESSES_KEY);
    secureStorage.removeItem(TILES_TURN_KEY);
    secureStorage.removeItem(MAX_TURNS_KEY);

    const newIndex = getRandom();
    setRandom(newIndex);
    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGuesses([]);
    setTurn(0);

    setMaxTurns(6);

    setGameState("playing");
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
    guesses,
    turn,
    maxTurns,
    gameState,
    letters,
    lastChanged,
    changeColor,
    submitGuess,
    resetGame,
    undoLastGuess,
    addExtraRow,
  };
}
