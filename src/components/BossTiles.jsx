import { useEffect, useState, useCallback, useRef } from "react";
import data from "../data/words.json";

export default function BossTiles({
  guesses = [],
  turn = 0,
  targetWords = [],
  gameState = "playing",
  onGuessSubmit,
  onGameOver,
  addToast,
  rowCount = 6,
}) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [solutions] = useState(targetWords.map((w) => w?.toLowerCase()));
  const [shake, setShake] = useState(false);
  const [lastSubmittedTurn, setLastSubmittedTurn] = useState(-1);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isSubmittingRef.current = false;
  }, [turn, gameState, guesses.length]);

  // For 2-word mode: track which word is active
  // For 4-word mode: apply guess to all words at once
  const isFourWordMode = solutions.length === 4;
  const isTwoWordMode = solutions.length === 2;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const getGuessStatuses = useCallback(
    (guessStr, wordIndex) => {
      const solution = solutions[wordIndex];
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
          const index = splitSolution.indexOf(char);
          if (index !== -1) {
            statuses[i] = "bg-gameYellow";
            splitSolution[index] = null;
          }
        }
      });
      return statuses;
    },
    [solutions],
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

        if (!data.includes(guessToSubmit)) {
          triggerShake();
          if (addToast) addToast("Incorrect word", "error");
          return;
        }

        // For 4-word mode: submit guess to all 4 words
        if (isFourWordMode) {
          // Check if all 4 words are already solved
          const allSolved = solutions.every((solution, idx) =>
            guesses.some((g) => g.word === solution && g.wordIndex === idx),
          );
          if (allSolved) {
            triggerShake();
            if (addToast) addToast("Already completed!", "error");
            return;
          }

          // Check if already guessed for any word
          if (
            guesses.some(
              (g) => g.word === guessToSubmit && turn === g.rowNumber,
            )
          ) {
            triggerShake();
            if (addToast)
              addToast("Already guessed this word for this row!", "error");
            return;
          }

          // Submit to all 4 words at once with single call
          if (onGuessSubmit(guessToSubmit)) {
            isSubmittingRef.current = true;
            setLastSubmittedTurn(turn);
            setCurrentGuess("");
          }
        } else {
          // For 2-word mode: check if both words are already solved
          const allSolved = solutions.every((solution, idx) =>
            guesses.some((g) => g.word === solution && g.wordIndex === idx),
          );
          if (allSolved) {
            triggerShake();
            if (addToast) addToast("Already completed!", "error");
            return;
          }

          // Submit once and it applies to both words
          if (onGuessSubmit(guessToSubmit, 0)) {
            isSubmittingRef.current = true;
            setLastSubmittedTurn(turn);
            setCurrentGuess("");
          }
        }
      }

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
    rowCount,
    isFourWordMode,
    solutions,
  ]);

  // Build grid for each word
  const wordGrids = solutions.map((solution, wordIdx) => {
    // Gather guesses for this word and map them by rowNumber
    const guessesForWord = guesses.filter((g) => g.wordIndex === wordIdx);
    const guessByRow = {};
    guessesForWord.forEach((g) => {
      if (typeof g.rowNumber === "number") guessByRow[g.rowNumber] = g;
    });

    // Determine if this word is solved
    const isSolved = guessesForWord.some((g) => g.word === solution);
    // Last guess row is the max rowNumber for this word, or -1
    const lastGuessRow =
      guessesForWord.length > 0
        ? Math.max(...guessesForWord.map((g) => g.rowNumber))
        : -1;

    const items = [];

    for (let i = 0; i < rowCount; i++) {
      // Quordle mode: if word is solved, skip rows below the last guess
      if (isSolved && i > lastGuessRow) {
        continue;
      }

      const isPrevRow = i < turn || (gameState === "won" && i === turn);
      const isCurrentRow = i === turn && gameState === "playing";

      // Check if this row has a guess for this word (by row index)
      const rowGuess = guessByRow[i];
      const isCorrectRow = guessByRow[i]?.word === solution;
      const rowHasGuess = Boolean(rowGuess);
      const shouldFlip = i === lastSubmittedTurn && rowHasGuess;

      let rowLetters = Array(5).fill("");
      let rowStatuses = Array(5).fill("");

      if (isPrevRow && rowHasGuess) {
        rowLetters = rowGuess.word.split("");
        rowStatuses = getGuessStatuses(rowGuess.word, wordIdx);
      } else if (isCurrentRow) {
        // Show current guess in all words
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

        // Size adjustments: shrink tiles a bit in 4-word mode so columns fit
        // Slightly larger tiles for better readability
        const tileWidthClass = isFourWordMode ? "w-10" : "w-12";
        const tileHeight = isCurrentRow
          ? isFourWordMode
            ? "h-10"
            : "h-11"
          : isFourWordMode
            ? "h-7"
            : "h-10";
        const fontSize = isCurrentRow
          ? isFourWordMode
            ? "text-2xl"
            : "text-[26px]"
          : "text-[22px]";
        // Decrease spacing to match normal `Tiles` component; shrink to 1px
        const tileMargin = "m-[1.5px]";

        items.push({
          wordIdx,
          key: `${wordIdx}-${i}-${j}`,
          className: `
              text-center ${tileWidthClass} ${tileHeight} ${tileMargin} ${fontSize} text-gameDark pointer-events-none font-bold uppercase border-2 transition-all outline-none rounded aspect-square
              ${isCurrentRow || isCorrectRow ? "opacity-100" : "opacity-60"}
              ${shouldFlip ? "animate-flip" : ""}
              ${isNextTile ? "border-gameGreen!" : "border-transparent!"}
              ${shake && isCurrentRow ? "animate-shake border-red-500!" : ""}
              ${colorClass}
            `,
          value: char || "",
          style: shouldFlip
            ? {
                animationDelay: `${j * 150}ms`,
                transitionDelay: `${j * 150 + 300}ms`,
              }
            : {},
        });
      }
    }

    return items;
  });

  // Layout based on word count
  // Use tighter gaps for boss modes so they match normal `Tiles` spacing
  const containerClass = isFourWordMode
    ? "flex flex-row gap-4 w-fit"
    : isTwoWordMode
      ? "flex flex-row gap-20 w-fit mx-auto"
      : "flex flex-row gap-20 w-fit mx-auto";

  return (
    <div className={containerClass}>
      {solutions.map((solution, wordIdx) => {
        // Check if this word is solved
        const wordGuesses = guesses.filter((g) => g.wordIndex === wordIdx);
        const isSolved = wordGuesses.some((g) => g.word === solution);

        return (
          <div key={wordIdx} className="flex flex-col items-center m-0 p-0">
            <div
              className={`grid grid-cols-5 ${isFourWordMode ? "gap-px" : isTwoWordMode ? "gap-1" : "gap-x-1 gap-y-0.5"} w-fit`}
            >
              {wordGrids[wordIdx].map((item) => (
                <input
                  key={item.key}
                  className={item.className}
                  style={item.style}
                  value={item.value}
                  readOnly
                />
              ))}
            </div>
            {/* Show Done indicator for solved words */}
            {isSolved && (
              <div className="mt-2 px-4 py-1 text-gameGreen/50 font-bold rounded text-sm w-full border center">
                Word Defeated
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
