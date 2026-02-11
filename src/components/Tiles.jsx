import { useEffect, useState, useCallback } from "react";
import data from "../data/words.json";

export default function Tiles({ targetWord, changeColor, storageKey }) {
  const today = new Date().toDateString();

  // --- Dynamic Storage Keys ---
  // Uses the 'storageKey' prop (usually 'daily') to keep different modes separate
  const GUESSES_KEY = `${storageKey}-guesses`;
  const TURN_KEY = `${storageKey}-turn`;
  const DATE_KEY = `${storageKey}-date`;

  // --- Game State Initialization ---
  // Guesses: Loaded from localStorage if the saved date is still today
  const [guesses, setGuesses] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    const savedGuesses = localStorage.getItem(GUESSES_KEY);
    return savedDate === today && savedGuesses ? JSON.parse(savedGuesses) : [];
  });

  // Current Turn: Tracking how many attempts have been made (0-5)
  const [turn, setTurn] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    const savedTurn = localStorage.getItem(TURN_KEY);
    return savedDate === today && savedTurn ? parseInt(savedTurn) : 0;
  });

  // Derived Game State: Determining if the user has already won or lost
  const [gameState, setGameState] = useState(() => {
    const lastGuess = guesses[guesses.length - 1];
    if (lastGuess === targetWord.toLowerCase()) return "won";
    if (turn >= 6) return "lost";
    return "playing";
  });

  const [currentGuess, setCurrentGuess] = useState("");
  const [solution] = useState(targetWord.toLowerCase());
  const [shake, setShake] = useState(false);
  const [lastSubmittedTurn, setLastSubmittedTurn] = useState(-1);

  // Sync game progress to LocalStorage whenever guesses or turns change
  useEffect(() => {
    localStorage.setItem(GUESSES_KEY, JSON.stringify(guesses));
    localStorage.setItem(TURN_KEY, turn.toString());
    localStorage.setItem(DATE_KEY, today);
  }, [guesses, turn, today, GUESSES_KEY, TURN_KEY, DATE_KEY]);

  // --- Status Logic ---
  // Compares a guess against the solution and returns an array of colors (Green/Yellow/Grey)
  const getGuessStatuses = useCallback(
    (guessStr) => {
      const splitSolution = solution.split("");
      const splitGuess = guessStr.split("");
      const statuses = Array(5).fill("bg-gameGrey");

      // First pass: Find exact matches (Green)
      splitGuess.forEach((char, i) => {
        if (char === splitSolution[i]) {
          statuses[i] = "bg-gameGreen";
          splitSolution[i] = null; // Mark as used
        }
      });

      // Second pass: Find existing but misplaced letters (Yellow)
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
    },
    [solution],
  );

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // --- Keyboard Event Listener ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing" || turn >= 6) return;
      const key = e.key;

      if (key === "Enter") {
        const guessToSubmit = currentGuess.toLowerCase();
        // Validation: Must be 5 letters, in the word list, and not already guessed
        if (
          guessToSubmit.length !== 5 ||
          !data.includes(guessToSubmit) ||
          guesses.includes(guessToSubmit)
        ) {
          triggerShake();
          return;
        }

        const statuses = getGuessStatuses(guessToSubmit);
        // Staggered update for keyboard colors to match the tile flip animation
        guessToSubmit.split("").forEach((char, i) => {
          setTimeout(() => changeColor(statuses[i], char), i * 150 + 300);
        });

        setLastSubmittedTurn(turn);
        const newGuesses = [...guesses, guessToSubmit];
        setGuesses(newGuesses);

        if (guessToSubmit === solution) {
          setGameState("won");
        } else {
          setTurn((prev) => prev + 1);
          if (turn === 5) setGameState("lost");
        }
        setCurrentGuess("");
      }

      if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (/^[A-Za-z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => (prev + key).toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentGuess,
    turn,
    guesses,
    gameState,
    solution,
    changeColor,
    getGuessStatuses,
  ]);

  // --- Grid Rendering Logic ---
  const items = [];
  for (let i = 0; i < 6; i++) {
    const isPrevRow = i < turn || (gameState === "won" && i === turn);
    const isCurrentRow = i === turn && gameState === "playing";
    const shouldFlip = i === lastSubmittedTurn;

    let rowLetters = Array(5).fill("");
    let rowStatuses = Array(5).fill("");

    if (isPrevRow && guesses[i]) {
      rowLetters = guesses[i].split("");
      rowStatuses = getGuessStatuses(guesses[i]);
    } else if (isCurrentRow) {
      rowLetters = currentGuess.split("");
    }

    for (let j = 0; j < 5; j++) {
      const char = rowLetters[j];
      const isNextTile = isCurrentRow && j === currentGuess.length;

      let colorClass = "bg-gameLight border-gameLight";
      if (isPrevRow) {
        if (rowStatuses[j] === "bg-gameGreen")
          colorClass = "bg-gameGreen border-gameGreen text-gameDark";
        else if (rowStatuses[j] === "bg-gameYellow")
          colorClass = "bg-gameYellow border-gameYellow text-gameDark";
        else colorClass = "bg-gameGrey border-gameGrey text-gameDark";
      }

      items.push(
        <input
          key={`${i}-${j}`}
          className={`
              text-center aspect-square w-11 m-0.5 text-gameDark pointer-events-none text-2xl font-bold uppercase border-2 transition-all outline-none rounded
              ${isCurrentRow || (gameState === "won" && i === turn) ? "opacity-100" : "opacity-60"}
              ${shouldFlip ? "animate-flip" : ""}
              ${isNextTile ? "border-gameGreen scale-105" : "border-transparent"}
              ${shake && isCurrentRow ? "animate-shake border-red-500!" : ""}
              ${colorClass}
            `}
          // Inline styles to stagger animations based on tile index
          style={
            shouldFlip
              ? {
                  animationDelay: `${j * 150}ms`,
                  transitionDelay: `${j * 150 + 300}ms`,
                }
              : {}
          }
          value={char || ""}
          readOnly
        />,
      );
    }
  }

  return <div className="grid grid-cols-5">{items}</div>;
}
