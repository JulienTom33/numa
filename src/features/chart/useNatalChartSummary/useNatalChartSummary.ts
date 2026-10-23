import { useCallback, useEffect, useState } from "react";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import { fetchNatalChartSummary, type NatalChartSummary } from "../natalChartSummary/natalChartSummary";

export type NatalChartSummaryStatus = "loading" | "ready" | "error";

export interface UseNatalChartSummaryResult {
  status: NatalChartSummaryStatus;
  summary: NatalChartSummary | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useNatalChartSummary(): UseNatalChartSummaryResult {
  const [status, setStatus] = useState<NatalChartSummaryStatus>("loading");
  const [summary, setSummary] = useState<NatalChartSummary | null>(null);
  const [errorCode, setErrorCode] = useState<NatalChartErrorCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorCode(null);

    void fetchNatalChartSummary().then((result) => {
      if (cancelled) return;
      setSummary(result.summary);
      setErrorCode(result.error);
      setStatus(result.error ? "error" : "ready");
    });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { status, summary, errorCode, retry };
}
