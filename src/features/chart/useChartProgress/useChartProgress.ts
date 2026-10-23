import { useCallback, useEffect, useState } from "react";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import { streamNatalChart } from "../natalChartProgress/natalChartProgress";
import { CHART_PHASES } from "../../../../shared/contracts/natalChart/natalChart.ts";

export type ChartProgressStatus = "loading" | "done" | "error";

export interface UseChartProgressResult {
  completedCount: number;
  status: ChartProgressStatus;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useChartProgress(): UseChartProgressResult {
  const [completedCount, setCompletedCount] = useState(0);
  const [status, setStatus] = useState<ChartProgressStatus>("loading");
  const [errorCode, setErrorCode] = useState<NatalChartErrorCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCompletedCount(0);
    setStatus("loading");
    setErrorCode(null);

    void streamNatalChart((phase) => {
      if (!controller.signal.aborted) setCompletedCount(CHART_PHASES.indexOf(phase) + 1);
    }, controller.signal).then((error) => {
      if (controller.signal.aborted) return;
      if (error) {
        setErrorCode(error);
        setStatus("error");
        return;
      }
      setCompletedCount(CHART_PHASES.length);
      setStatus("done");
    });

    return () => {
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { completedCount, status, errorCode, retry };
}
