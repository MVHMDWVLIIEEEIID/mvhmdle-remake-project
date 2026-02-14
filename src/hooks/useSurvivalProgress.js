import { useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage"; // [NEW] Import

const DEFAULT_HINTS = {
  "Hide a Letter": { cost: 500, bought: 0, desc: "Discard 1 incorrect key." },
  "Vowel Letter": { cost: 500, bought: 0, desc: "Locate a hidden vowel." },
  "Yellow Letter": { cost: 500, bought: 0, desc: "Find a misplaced key." },
  "Green Letter": { cost: 800, bought: 0, desc: "Confirm a correct spot." },
  Row: { cost: 1200, bought: 0, desc: "Get a Seventh Row" },
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

  // State Initializers with Encryption
  const [currency, setCurrency] = useState(() => {
    // [UPDATED] secureStorage automatically handles type conversion (int)
    return secureStorage.getItem(CURRENCY_KEY, 2500);
  });

  const [hintsArray, setHintsArray] = useState(() => {
    // [UPDATED] secureStorage automatically parses JSON
    const parsed = secureStorage.getItem(SHOP_DATA_KEY, null);
    if (parsed) {
      // Deep copy DEFAULT_HINTS to avoid mutating the original object
      const merged = JSON.parse(JSON.stringify(DEFAULT_HINTS));
      Object.keys(merged).forEach((key) => {
        if (parsed[key]) {
          merged[key].bought = parsed[key].bought;
        }
      });
      return merged;
    }
    return JSON.parse(JSON.stringify(DEFAULT_HINTS));
  });

  const [hintsUsedInRound, setHintsUsedInRound] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(HINTS_USED_KEY, {});
  });

  const [hintHistory, setHintHistory] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(HINT_HISTORY_KEY, []);
  });

  const [hearts, setHearts] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(HEARTS_KEY, 3);
  });

  const [streak, setStreak] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(STREAK_KEY, 0);
  });

  const [lastReward, setLastReward] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(LAST_REWARD_KEY, null);
  });

  const [gamesPlayed, setGamesPlayed] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(GAMES_PLAYED_KEY, 1);
  });

  // Effects for Persistence with Encryption
  useEffect(
    () => secureStorage.setItem(CURRENCY_KEY, currency),
    [currency, CURRENCY_KEY],
  );
  useEffect(
    () => secureStorage.setItem(SHOP_DATA_KEY, hintsArray),
    [hintsArray, SHOP_DATA_KEY],
  );
  useEffect(
    () => secureStorage.setItem(HINTS_USED_KEY, hintsUsedInRound),
    [hintsUsedInRound, HINTS_USED_KEY],
  );
  useEffect(
    () => secureStorage.setItem(HINT_HISTORY_KEY, hintHistory),
    [hintHistory, HINT_HISTORY_KEY],
  );
  useEffect(
    () => secureStorage.setItem(HEARTS_KEY, hearts),
    [hearts, HEARTS_KEY],
  );
  useEffect(
    () => secureStorage.setItem(STREAK_KEY, streak),
    [streak, STREAK_KEY],
  );
  useEffect(
    () => secureStorage.setItem(GAMES_PLAYED_KEY, gamesPlayed),
    [gamesPlayed, GAMES_PLAYED_KEY],
  );

  useEffect(() => {
    if (lastReward) secureStorage.setItem(LAST_REWARD_KEY, lastReward);
    else secureStorage.removeItem(LAST_REWARD_KEY);
  }, [lastReward, LAST_REWARD_KEY]);

  const resetRoundInfo = () => {
    setHintsUsedInRound({});
    setLastReward(null);
  };

  const resetAllProgress = () => {
    // 1. Remove ALL relevant keys using secureStorage
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
    keysToRemove.forEach((key) => secureStorage.removeItem(key));

    // 2. Reset States to Default
    setStreak(0);
    setHearts(3);
    setCurrency(2500);
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
