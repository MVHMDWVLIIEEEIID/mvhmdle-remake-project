import React, { useState, useEffect } from 'react';

export default function CountDown() {

  const getNextMidnight = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const [targetDate, setTargetDate] = useState(getNextMidnight());
  const [timeLeft, setTimeLeft] = useState(targetDate - window.Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = targetDate - now;

      if (remaining <= 0) {
        // IT'S MIDNIGHT! 
        // 1. Set a new target for the following day
        const nextTarget = getNextMidnight();
        setTargetDate(nextTarget);
        // 2. Update the display immediately
        setTimeLeft(nextTarget - now);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]); // Effect re-runs only when the target date is updated

  // Math for display
  const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeft / (1000 * 60)) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <div className="grid grid-flow-col gap-2 text-center auto-cols-max dark:text-gameDark items-center">
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": h, "--digits": 2 }}></span>h
        </span>
      </div>
      :
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": m, "--digits": 2 }}></span>m
        </span>
      </div>
      :
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": s, "--digits": 2 }}></span>s
        </span>
      </div>
    </div>
  )
}