import { useCallback, useEffect, useState } from "react";

const TICK_MS = 1000;

function toWholeSeconds(seconds: number): number {
  return Math.max(0, Math.ceil(seconds));
}

export function useCooldown(initialSeconds = 0) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => toWholeSeconds(initialSeconds));

  const isCoolingDown = remainingSeconds > 0;

  useEffect(() => {
    if (!isCoolingDown) return undefined;
    const interval = setInterval(
      () => setRemainingSeconds((seconds) => Math.max(0, seconds - 1)),
      TICK_MS,
    );
    return () => clearInterval(interval);
  }, [isCoolingDown]);

  const start = useCallback((seconds: number) => {
    setRemainingSeconds(toWholeSeconds(seconds));
  }, []);

  return { remainingSeconds, isCoolingDown, start };
}
