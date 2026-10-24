import { useQuery } from "@tanstack/react-query";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { chartErrorCode, myChartQueryOptions } from "../chartQueries/chartQueries";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import type { NatalChartSummary } from "../natalChartSummary/natalChartSummary";

export type NatalChartSummaryStatus = LoadStatus;

export interface UseNatalChartSummaryResult {
  status: NatalChartSummaryStatus;
  summary: NatalChartSummary | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useNatalChartSummary(): UseNatalChartSummaryResult {
  const query = useQuery({ ...myChartQueryOptions(), select: (chart) => chart.summary });
  const { refetch } = query;

  return {
    status: loadStatus(query),
    summary: query.data ?? null,
    errorCode: query.isError ? chartErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
