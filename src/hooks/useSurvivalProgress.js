import { useState, useEffect } from "react";

const DEFAULT_HINTS = {
  "Hide a Letter": { cost: 500, bought: 0, desc: "Discard 1 incorrect key." },
  "Vowel Letter": { cost: 500, bought: 0, desc: "Locate a hidden vowel." },
  "Yellow Letter": { cost: 500, bought: 0, desc: "Find a misplaced key." },
  "Green Letter": { cost: 800, bought: 0, desc: "Confirm a correct spot." },
  Row: { cost: 1200, bought: 0, desc: "+1 Survival Attempt." },
  Heart: { cost: 2000, bought: 0, desc: "+1 Extra Life." },
  "Beat The Game": { cost: 999999, bought: 0, desc: "Instant Extraction." },
};

export default function useSurvivalProgress(mode) {
  // Keys
  const STREAK_KEY = `wordle-streak-${mode}`;
  const HEARTS_KEY = `wordle-hearts-${mode}`;
  const CURRENCY_KEY = `wordle-shop-currency`;
  const SHOP_DATA_KEY = `wordle-shop-data`;
  const HINTS_USED_KEY = `wordle-hints-used-${mode}`;
  const HINT_HISTORY_KEY = `wordle-hint-history-${mode}`;
  const LAST_REWARD_KEY = `wordle-last-reward-${mode}`;
  const GAMES_PLAYED_KEY = `wordle-games-played-${mode}`;

  // State Initializers
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem(CURRENCY_KEY);
    return saved ? parseInt(saved) : 2500;
  });

  const [hintsArray, setHintsArray] = useState(() => {
    const saved = localStorage.getItem(SHOP_DATA_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...DEFAULT_HINTS };
      Object.keys(merged).forEach((key) => {
        if (parsed[key]) merged[key].bought = parsed[key].bought;
      });
      return merged;
    }
    return JSON.parse(JSON.stringify(DEFAULT_HINTS));
  });

  const [hintsUsedInRound, setHintsUsedInRound] = useState(() => {
    const saved = localStorage.getItem(HINTS_USED_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [hintHistory, setHintHistory] = useState(() => {
    const saved = localStorage.getItem(HINT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [hearts, setHearts] = useState(() => {
    const saved = localStorage.getItem(HEARTS_KEY);
    return saved ? parseInt(saved) : 3;
  });

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem(STREAK_KEY);
    return saved ? parseInt(saved) : 0;
  });

  const [lastReward, setLastReward] = useState(() => {
    const saved = localStorage.getItem(LAST_REWARD_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [gamesPlayed, setGamesPlayed] = useState(() => {
    const saved = localStorage.getItem(GAMES_PLAYED_KEY);
    return saved ? parseInt(saved) : 1;
  });

  // Effects for Persistence
  useEffect(
    () => localStorage.setItem(CURRENCY_KEY, currency.toString()),
    [currency, CURRENCY_KEY],
  );
  useEffect(
    () => localStorage.setItem(SHOP_DATA_KEY, JSON.stringify(hintsArray)),
    [hintsArray, SHOP_DATA_KEY],
  );
  useEffect(
    () =>
      localStorage.setItem(HINTS_USED_KEY, JSON.stringify(hintsUsedInRound)),
    [hintsUsedInRound, HINTS_USED_KEY],
  );
  useEffect(
    () => localStorage.setItem(HINT_HISTORY_KEY, JSON.stringify(hintHistory)),
    [hintHistory, HINT_HISTORY_KEY],
  );
  useEffect(
    () => localStorage.setItem(HEARTS_KEY, hearts.toString()),
    [hearts, HEARTS_KEY],
  );
  useEffect(
    () => localStorage.setItem(STREAK_KEY, streak.toString()),
    [streak, STREAK_KEY],
  );
  useEffect(
    () => localStorage.setItem(GAMES_PLAYED_KEY, gamesPlayed.toString()),
    [gamesPlayed, GAMES_PLAYED_KEY],
  );

  useEffect(() => {
    if (lastReward)
      localStorage.setItem(LAST_REWARD_KEY, JSON.stringify(lastReward));
    else localStorage.removeItem(LAST_REWARD_KEY);
  }, [lastReward, LAST_REWARD_KEY]);

  const resetRoundInfo = () => {
    setHintsUsedInRound({});
    setLastReward(null);
  };

  const resetAllProgress = () => {
    // 1. Remove ALL relevant keys
    const keysToRemove = [
      STREAK_KEY,
      HEARTS_KEY,
      CURRENCY_KEY,
      SHOP_DATA_KEY,
      HINTS_USED_KEY,
      HINT_HISTORY_KEY,
      LAST_REWARD_KEY,
      GAMES_PLAYED_KEY,
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // 2. Reset States to Default
    setStreak(0);
    setHearts(3);
    setCurrency(2500);

    // IMPORTANT: Set to 0 so the next game init (which adds +1) results in Game 1
    setGamesPlayed(0);

    setHintsArray(JSON.parse(JSON.stringify(DEFAULT_HINTS)));
    setHintHistory([]);
    setHintsUsedInRound({});
    setLastReward(null);
  };

  return {
    currency,
    setCurrency,
    hintsArray,
    setHintsArray,
    hintsUsedInRound,
    setHintsUsedInRound,
    hintHistory,
    setHintHistory,
    hearts,
    setHearts,
    streak,
    setStreak,
    lastReward,
    setLastReward,
    gamesPlayed,
    setGamesPlayed,
    resetRoundInfo,
    resetAllProgress,
  };
}
