import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { CodedQueryError } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import { chartErrorCode } from "../chartQueries/chartQueries";
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
  const queryClient = useQueryClient();
  const [completedCount, setCompletedCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const computation = useMutation({
    mutationFn: async (signal: AbortSignal) => {
      setCompletedCount(0);
      const error = await streamNatalChart((phase) => {
        if (!signal.aborted) setCompletedCount(CHART_PHASES.indexOf(phase) + 1);
      }, signal);
      if (error) throw new CodedQueryError(error);
      if (!signal.aborted) setCompletedCount(CHART_PHASES.length);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chart.all }),
  });
  const { mutate, reset } = computation;

  useEffect(() => {
    const controller = new AbortController();
    mutate(controller.signal);

    return () => {
      controller.abort();
      reset();
    };
  }, [attempt, mutate, reset]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  let status: ChartProgressStatus = "loading";
  if (computation.isSuccess) status = "done";
  else if (computation.isError) status = "error";

  return {
    completedCount,
    status,
    errorCode: computation.isError ? chartErrorCode(computation.error) : null,
    retry,
  };
}
