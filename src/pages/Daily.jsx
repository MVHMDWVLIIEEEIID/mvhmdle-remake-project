import { useState, useEffect } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import Modal from "../components/Modal";
import data from "../data/words.json";

export default function Daily({ mode = "daily" }) {
  const todayDate = new Date();
  const todayString = todayDate.toDateString();
  const [isModalOpen, setIsModalOpen] = useState([false, "lost"]);

  // gameResetKey is used as a 'key' on <Tiles /> to force a hard-reset of that component
  const [gameResetKey, setGameResetKey] = useState(0);

  const solutionWords = data.slice(0, 3405);

  // Determine which word index to use based on days passed since Unix epoch
  const getDailyIndex = () => {
    const totalDays = Math.floor(todayDate.getTime() / (1000 * 60 * 60 * 24));
    return totalDays % solutionWords.length;
  };

  // --- Constants for Storage Keys ---
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const INDEX_KEY = `wordle-solution-index-${mode}`;
  const DATE_KEY = `wordle-date-${mode}`;

  // Storage keys used by the Tiles component to be cleared on reset
  const TILES_GUESSES_KEY = `${mode}-guesses`;
  const TILES_TURN_KEY = `${mode}-turn`;
  const TILES_DATE_KEY = `${mode}-date`;

  // Default state for a fresh keyboard
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

  // Load word index from storage or calculate new daily index
  const [random] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    if (savedDate !== todayString) return getDailyIndex();
    const savedIndex = localStorage.getItem(INDEX_KEY);
    return savedIndex ? parseInt(savedIndex) : getDailyIndex();
  });

  // Load keyboard status from storage
  const [letters, setLetters] = useState(() => {
    const savedDate = localStorage.getItem(DATE_KEY);
    const savedLetters = localStorage.getItem(LETTERS_KEY);
    return savedDate === todayString && savedLetters
      ? JSON.parse(savedLetters)
      : getInitialLetters();
  });

  const [lastChanged, setLastChanged] = useState({
    letter: null,
    timestamp: 0,
  });

  const targetWord = solutionWords[random];

  // Keep LocalStorage in sync with game state
  useEffect(() => {
    localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
    localStorage.setItem(INDEX_KEY, random.toString());
    localStorage.setItem(DATE_KEY, todayString);
  }, [letters, random, todayString, LETTERS_KEY, INDEX_KEY, DATE_KEY]);

  // Update keyboard colors based on guess results
  const changeColor = (newColor, letterKey) => {
    const key = letterKey.toLowerCase();
    setLetters((prev) => {
      const current = prev[key];
      if (!current) return prev;

      // Hierarchy logic: Green beats Yellow, Yellow beats Grey
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

  // --- DEBUG RESET FUNCTION ---
  // Wipes LocalStorage and resets state to restart the game
  const handleReset = (e) => {
    e.currentTarget.blur(); // Remove focus so typing still works
    localStorage.removeItem(LETTERS_KEY);
    localStorage.removeItem(TILES_GUESSES_KEY);
    localStorage.removeItem(TILES_TURN_KEY);
    localStorage.removeItem(TILES_DATE_KEY);

    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGameResetKey((prev) => prev + 1); // Changing the key prop forces Tiles to remount
  };

  const handleGameOver = (result) => {
    if (result === "won") {
      setTimeout(() => setIsModalOpen([true, "won"]), 1500);
    } else if (result === "lost") {
      setTimeout(() => setIsModalOpen([true, "lost"]), 1500);
    } else if (result === "won-already") {
      setIsModalOpen([true, "won"]);
    } else if (result === "lost-already") {
      setIsModalOpen([true, "lost"]);
    }
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <div className="flex-1 center">
        <Header mode={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`} />
      </div>
      <div className="flex-6 center">
        <div className="w-1/2 h-full center">
          {/* Key prop ensures the whole component restarts on reset */}
          <Tiles
            key={gameResetKey}
            targetWord={targetWord}
            changeColor={changeColor}
            storageKey={mode}
            onGameOver={handleGameOver}
          />
        </div>
      </div>
      <div className="flex-5 center shrink-0 mb-4">
        <Keyboard letters={letters} lastChanged={lastChanged} />
      </div>

      {/* Debug Reset Button positioned at bottom-right */}
      <button
        onClick={handleReset}
        className="absolute bottom-4 right-4 bg-gameRed hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg text-sm z-50 transition-colors"
      >
        Reset Game ({targetWord.toUpperCase()})
      </button>

      <Modal
        isOpen={isModalOpen[0]}
        onClose={() => {
          setIsModalOpen([false, isModalOpen[1]]);
          document.activeElement.blur();
          window.focus();
        }}
        title={isModalOpen[1] === "won" ? "You Won" : "Game Over"}
      >
        <p className="text-lg">Great job! You found the word.</p>
        <p className="mt-2 text-sm opacity-70">
          Would you like to try another one?
        </p>
      </Modal>
    </div>
  );
}
