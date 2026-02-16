import { useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage"; // [NEW] Import

const DEFAULT_HINTS = {
  "Hide a Letter": { cost: 500, bought: 0, desc: "Discard 1 incorrect key." },
  "Vowel Letter": { cost: 500, bought: 0, desc: "Locate a hidden vowel." },
  "Yellow Letter": { cost: 1000, bought: 0, desc: "Find a misplaced key." },
  "Green Letter": { cost: 1800, bought: 0, desc: "Confirm a correct spot." },
  Row: { cost: 2500, bought: 0, desc: "Get a Seventh Row" },
  Heart: { cost: 50000, bought: 0, desc: "+1 Extra Life." },
  "Beat The Game": { cost: 999999, bought: 0, desc: "Instant Extraction." },
};

const DEFAULT_RUN_STATS = {
  wins: 0,
  losses: 0,
  wordsGuessed: 0,
  wordsTyped: 0,
  highestStreak: 0,
  highestCash: 2500,
};

export default function useSurvivalProgress(mode) {
  const MAX_HEARTS = 5;
  // Keys
  const STREAK_KEY = `wordle-streak-${mode}`;
  const HEARTS_KEY = `wordle-hearts-${mode}`;
  const CURRENCY_KEY = `wordle-shop-currency`;
  const SHOP_DATA_KEY = `wordle-shop-data`;
  const HINTS_USED_KEY = `wordle-hints-used-${mode}`;
  const HINT_HISTORY_KEY = `wordle-hint-history-${mode}`;
  const LAST_REWARD_KEY = `wordle-last-reward-${mode}`;
  const GAMES_PLAYED_KEY = `wordle-games-played-${mode}`;
  const BOSS2_COUNT_KEY = `wordle-boss2-count-${mode}`;
  const BOSS4_COUNT_KEY = `wordle-boss4-count-${mode}`;
  const RUN_STATS_KEY = `wordle-run-stats-${mode}`;
  const RUN_COMPLETED_KEY = `wordle-run-completed-${mode}`;

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
    const saved = secureStorage.getItem(HEARTS_KEY, 3);
    return Math.max(0, Math.min(MAX_HEARTS, saved));
  });

  const [streak, setStreak] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(STREAK_KEY, 0);
  });

  const [lastReward, setLastReward] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(LAST_REWARD_KEY, null);
  });

  const [boss2Count, setBoss2Count] = useState(() => {
    return secureStorage.getItem(BOSS2_COUNT_KEY, 0);
  });

  const [boss4Count, setBoss4Count] = useState(() => {
    return secureStorage.getItem(BOSS4_COUNT_KEY, 0);
  });

  const [gamesPlayed, setGamesPlayed] = useState(() => {
    // [UPDATED]
    return secureStorage.getItem(GAMES_PLAYED_KEY, 1);
  });

  const [runStats, setRunStats] = useState(() => {
    const saved = secureStorage.getItem(RUN_STATS_KEY, null);
    return { ...DEFAULT_RUN_STATS, ...(saved || {}) };
  });

  const [runCompleted, setRunCompleted] = useState(() => {
    return secureStorage.getItem(RUN_COMPLETED_KEY, false);
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
    secureStorage.setItem(BOSS2_COUNT_KEY, boss2Count);
  }, [boss2Count, BOSS2_COUNT_KEY]);

  useEffect(() => {
    secureStorage.setItem(BOSS4_COUNT_KEY, boss4Count);
  }, [boss4Count, BOSS4_COUNT_KEY]);

  useEffect(() => {
    if (lastReward) secureStorage.setItem(LAST_REWARD_KEY, lastReward);
    else secureStorage.removeItem(LAST_REWARD_KEY);
  }, [lastReward, LAST_REWARD_KEY]);

  useEffect(() => {
    secureStorage.setItem(RUN_STATS_KEY, runStats);
  }, [runStats, RUN_STATS_KEY]);

  useEffect(() => {
    secureStorage.setItem(RUN_COMPLETED_KEY, runCompleted);
  }, [runCompleted, RUN_COMPLETED_KEY]);

  useEffect(() => {
    setRunStats((prev) => {
      const current = { ...DEFAULT_RUN_STATS, ...(prev || {}) };
      if (streak <= current.highestStreak) return current;
      return { ...current, highestStreak: streak };
    });
  }, [streak]);

  useEffect(() => {
    setRunStats((prev) => {
      const current = { ...DEFAULT_RUN_STATS, ...(prev || {}) };
      if (currency <= current.highestCash) return current;
      return { ...current, highestCash: currency };
    });
  }, [currency]);

  const addWordsTyped = (count = 1) => {
    if (count <= 0) return;
    setRunStats((prev) => ({
      ...DEFAULT_RUN_STATS,
      ...(prev || {}),
      wordsTyped: ((prev?.wordsTyped || 0) + count),
    }));
  };

  const addWin = (wordsGuessed = 1) => {
    setRunStats((prev) => ({
      ...DEFAULT_RUN_STATS,
      ...(prev || {}),
      wins: (prev?.wins || 0) + 1,
      wordsGuessed: (prev?.wordsGuessed || 0) + Math.max(1, wordsGuessed),
    }));
  };

  const addLoss = () => {
    setRunStats((prev) => ({
      ...DEFAULT_RUN_STATS,
      ...(prev || {}),
      losses: (prev?.losses || 0) + 1,
    }));
  };

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
      BOSS2_COUNT_KEY,
      BOSS4_COUNT_KEY,
      RUN_STATS_KEY,
      RUN_COMPLETED_KEY,
    ];
    keysToRemove.forEach((key) => secureStorage.removeItem(key));

    // 2. Reset States to Default
    setStreak(0);
    setHearts(3);
    setCurrency(2500);
    setGamesPlayed(1);

    setHintsArray(JSON.parse(JSON.stringify(DEFAULT_HINTS)));
    setHintHistory([]);
    setHintsUsedInRound({});
    setLastReward(null);
    setBoss2Count(0);
    setBoss4Count(0);
    setRunStats(DEFAULT_RUN_STATS);
    setRunCompleted(false);
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
    boss2Count,
    setBoss2Count,
    boss4Count,
    setBoss4Count,
    runStats,
    addWordsTyped,
    addWin,
    addLoss,
    runCompleted,
    setRunCompleted,
    resetRoundInfo,
    resetAllProgress,
  };
}
