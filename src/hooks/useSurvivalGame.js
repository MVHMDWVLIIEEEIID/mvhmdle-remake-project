import { useState, useEffect } from "react";
import data from "../data/words.json";

export default function useSurvivalGame(mode) {
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const INDEX_KEY = `wordle-solution-index-${mode}`;
  const TILES_GUESSES_KEY = `${mode}-guesses`;
  const TILES_TURN_KEY = `${mode}-turn`;
  const DATE_KEY = `${mode}-date`;
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

  const [random, setRandom] = useState(() => {
    const savedIndex = localStorage.getItem(INDEX_KEY);
    return savedIndex ? parseInt(savedIndex) : getRandom();
  });
  const targetWord = solutionWords[random];

  const [guesses, setGuesses] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    const savedGuesses = localStorage.getItem(TILES_GUESSES_KEY);
    return savedDate === today && savedGuesses ? JSON.parse(savedGuesses) : [];
  });

  const [turn, setTurn] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    const savedTurn = localStorage.getItem(TILES_TURN_KEY);
    return savedDate === today && savedTurn ? parseInt(savedTurn) : 0;
  });

  const [gameState, setGameState] = useState(() => {
    const lastGuess = guesses[guesses.length - 1];
    if (lastGuess === targetWord?.toLowerCase()) return "won";
    if (turn >= 6) return "lost";
    return "playing";
  });

  const [letters, setLetters] = useState(() => {
    const savedLetters = localStorage.getItem(LETTERS_KEY);
    try {
      return savedLetters ? JSON.parse(savedLetters) : getInitialLetters();
    } catch (e) {
      return getInitialLetters();
    }
  });

  const [lastChanged, setLastChanged] = useState({
    letter: null,
    timestamp: 0,
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
    localStorage.setItem(INDEX_KEY, random.toString());
  }, [letters, random, LETTERS_KEY, INDEX_KEY]);

  useEffect(() => {
    localStorage.setItem(TILES_GUESSES_KEY, JSON.stringify(guesses));
    localStorage.setItem(TILES_TURN_KEY, turn.toString());
    localStorage.setItem(DATE_KEY, today);
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
      // Pass guess count to calculate score
      onGameOver("won", newGuesses.length);
    } else {
      const newTurn = turn + 1;
      setTurn(newTurn);
      if (newTurn >= 6) {
        setGameState("lost");
        onGameOver("lost", 6);
      }
    }
    return true;
  };

  const resetGame = () => {
    localStorage.removeItem(INDEX_KEY);
    localStorage.removeItem(LETTERS_KEY);
    localStorage.removeItem(TILES_GUESSES_KEY);
    localStorage.removeItem(TILES_TURN_KEY);

    const newIndex = getRandom();
    setRandom(newIndex);
    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGuesses([]);
    setTurn(0);
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
    gameState,
    letters,
    lastChanged,
    changeColor,
    submitGuess,
    resetGame,
    undoLastGuess,
  };
}
