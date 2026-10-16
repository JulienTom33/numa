import { useCallback, useEffect, useState } from "react";
import type { ComputedAscendant } from "../lib/ascendant";
import { fetchComputedAscendant, type NatalChartErrorCode } from "../lib/natalChart";

export type ComputedAscendantStatus = "idle" | "loading" | "ready" | "error";

export interface UseComputedAscendantResult {
  status: ComputedAscendantStatus;
  ascendant: ComputedAscendant | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useComputedAscendant(enabled: boolean, refreshKey: string | null): UseComputedAscendantResult {
  const [status, setStatus] = useState<ComputedAscendantStatus>("idle");
  const [ascendant, setAscendant] = useState<ComputedAscendant | null>(null);
  const [errorCode, setErrorCode] = useState<NatalChartErrorCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorCode(null);

    fetchComputedAscendant().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.error) {
        setAscendant(null);
        setErrorCode(result.error);
        setStatus("error");
        return;
      }
      setAscendant(result.ascendant);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey, attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { status, ascendant, errorCode, retry };
}
