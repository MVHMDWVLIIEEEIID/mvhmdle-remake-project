import { useEffect, useState, useCallback, useRef } from "react";
import data from "../data/words.json";

export default function Tiles({
  guesses = [],
  turn = 0,
  targetWord,
  gameState = "playing",
  onGuessSubmit,
  onGameOver,
  addToast,
  rowCount = 6, // [NEW] Default to 6, but allow overrides
}) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [solution] = useState(targetWord?.toLowerCase());
  const [shake, setShake] = useState(false);
  const [lastSubmittedTurn, setLastSubmittedTurn] = useState(-1);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isSubmittingRef.current = false;
  }, [turn, gameState, guesses.length]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const getGuessStatuses = useCallback(
    (guessStr) => {
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
          const index = splitSolution.indexOf(char);
          if (index !== -1) {
            statuses[i] = "bg-gameYellow";
            splitSolution[index] = null;
          }
        }
      });
      return statuses;
    },
    [solution],
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }
      const key = e.key;

      if (key === "Enter") {
        if (isSubmittingRef.current) return;
        // [UPDATED] Use rowCount instead of hardcoded 6
        if (gameState !== "playing" || turn >= rowCount) {
          if (gameState === "won") onGameOver("won-already");
          else onGameOver("lost-already");
          return;
        }

        const guessToSubmit = currentGuess?.toLowerCase();

        if (guessToSubmit.length !== 5) {
          triggerShake();
          if (addToast) addToast("Not enough letters!", "error");
          return;
        }
        if (guesses.includes(guessToSubmit)) {
          triggerShake();
          if (addToast) addToast("Word already submitted!", "error");
          return;
        }
        if (!data.includes(guessToSubmit)) {
          triggerShake();
          if (addToast) addToast("Incorrect word", "error");
          return;
        }

        if (onGuessSubmit && onGuessSubmit(guessToSubmit)) {
          isSubmittingRef.current = true;
          setLastSubmittedTurn(turn);
          setCurrentGuess("");
        }
      }

      // [UPDATED] Use rowCount check
      if (gameState !== "playing" || turn >= rowCount) return;

      if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess((prev) => (prev + key)?.toLowerCase());
        }
      } else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (addToast) addToast("Game only accepts English letters", "error");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentGuess,
    turn,
    guesses,
    gameState,
    onGuessSubmit,
    onGameOver,
    addToast,
    rowCount, // [NEW] Dependency
  ]);

  const items = [];
  // [UPDATED] Loop based on rowCount prop
  for (let i = 0; i < rowCount; i++) {
    const isPrevRow = i < turn || (gameState === "won" && i === turn);
    const isCurrentRow = i === turn && gameState === "playing";

    // [FIX] Ensure we only animate if the guess actually exists
    const shouldFlip = i === lastSubmittedTurn && guesses[i];

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
              ${isNextTile ? "border-gameGreen!" : "border-transparent"}
              ${shake && isCurrentRow ? "animate-shake border-red-500!" : ""}
              ${colorClass}
            `}
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

  return <div className="grid grid-cols-5 gap-0.5 w-fit mx-auto">{items}</div>;
}
