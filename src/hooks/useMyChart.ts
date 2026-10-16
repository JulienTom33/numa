import { useCallback, useEffect, useState } from "react";
import type { NatalChartErrorCode } from "../lib/natalChart";
import { fetchMyChart, type MyChartData } from "../lib/skyChart";

export type MyChartStatus = "loading" | "ready" | "error";

export interface UseMyChartResult {
  status: MyChartStatus;
  data: MyChartData | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useMyChart(): UseMyChartResult {
  const [status, setStatus] = useState<MyChartStatus>("loading");
  const [data, setData] = useState<MyChartData | null>(null);
  const [errorCode, setErrorCode] = useState<NatalChartErrorCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorCode(null);

    void fetchMyChart().then((result) => {
      if (cancelled) return;
      setData(result.data);
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

  return { status, data, errorCode, retry };
}
