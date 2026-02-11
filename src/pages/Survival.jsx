import { useState, useEffect } from "react";
import Header from "../components/Header";
import Keyboard from "../components/Keyboard";
import Tiles from "../components/Tiles";
import data from "../data/words.json";
import Modal from "../components/Modal";

export default function Survival({ mode = "survival" }) {
  const [gameResetKey, setGameResetKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState([false, "lost"]);

  // const messyList = data; // Example with duplicates
  // const cleanList = [...new Set(messyList)];

  // console.log(cleanList); // Output: ["apple", "crane", "stomp"]

  // --- Constants for Storage Keys ---
  const LETTERS_KEY = `wordle-letters-${mode}`;
  const INDEX_KEY = `wordle-solution-index-${mode}`;
  const STREAK_KEY = `wordle-streak-${mode}`;

  // Storage keys used by the Tiles component to be cleared on reset
  const TILES_GUESSES_KEY = `${mode}-guesses`;
  const TILES_TURN_KEY = `${mode}-turn`;

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

  const solutionWords = data.slice(0, 3405);

  function getRandom() {
    return Math.floor(Math.random() * solutionWords.length);
  }

  // Load word index from storage or calculate new daily index
  const [random, setRandom] = useState(() => {
    const savedIndex = localStorage.getItem(INDEX_KEY);
    return savedIndex ? parseInt(savedIndex) : getRandom();
  });

  // Load keyboard status from storage
  const [letters, setLetters] = useState(() => {
    const savedLetters = localStorage.getItem(LETTERS_KEY);

    // 1. If it's the first time playing this mode, savedLetters will be null.
    // 2. We MUST use JSON.parse() for objects. parseInt() will return NaN for an object string.
    try {
      return savedLetters ? JSON.parse(savedLetters) : getInitialLetters();
    } catch (e) {
      console.log(e);
      return getInitialLetters();
    }
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
  }, [letters, random, LETTERS_KEY, INDEX_KEY]);

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

  const handleReset = () => {
    document.activeElement.blur();
    window.focus();
    // 1. Clear storage
    localStorage.removeItem(INDEX_KEY);
    localStorage.removeItem(LETTERS_KEY);
    localStorage.removeItem(TILES_GUESSES_KEY);
    localStorage.removeItem(TILES_TURN_KEY);
    localStorage.removeItem(TILES_TURN_KEY);

    // 2. Repick the word by updating state
    const newIndex = getRandom();
    setRandom(newIndex); // This is the key step to change the word without a refresh

    // 3. Reset other game states
    setLetters(getInitialLetters());
    setLastChanged({ letter: null, timestamp: 0 });
    setGameResetKey((prev) => prev + 1);
  };

  // 1. Initialize streak from storage
  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem(STREAK_KEY);
    return savedStreak ? parseInt(savedStreak) : 0;
  });

  // 2. Sync streak to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STREAK_KEY, streak.toString());
  }, [streak, mode, STREAK_KEY]);

  // 3. Create the win/lost handler
  const handleGameOver = (result) => {
    if (result === "won") {
      setTimeout(() => {
        setStreak((prev) => prev + 1);
        setIsModalOpen([true, "won"]);
      }, 1500);
    } else if (result === "lost") {
      setStreak(0); // Reset streak on lost
      setTimeout(() => setIsModalOpen([true, "lost"]), 1500);
    } else if (result === "won-already") {
      setIsModalOpen([true, "won"]);
    } else if (result === "lost-already") {
      setIsModalOpen([true, "lost"]);
    }
    document.activeElement.blur();
    window.focus();
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gameDark text-white">
      <div className="flex-1 center">
        <Header
          mode={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`}
          streak={streak}
        />
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
        Reset Game ({targetWord?.toUpperCase()})
      </button>

      <Modal
        isOpen={isModalOpen[0]}
        onClose={() => {
          handleReset();
          setIsModalOpen([false, isModalOpen[1]]);
        }}
        title={isModalOpen[1] === "won" ? "You Won" : "Game Over"}
        onRestart={handleGameOver}
      >
        <p className="text-3xl">Your Current Streak : {streak}</p>
      </Modal>
    </div>
  );
}
