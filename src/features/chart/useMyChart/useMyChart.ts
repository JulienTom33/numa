import { useQuery } from "@tanstack/react-query";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { chartErrorCode, myChartQueryOptions } from "../chartQueries/chartQueries";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import type { MyChartData } from "../skyChart/skyChart";

export type MyChartStatus = LoadStatus;

export interface UseMyChartResult {
  status: MyChartStatus;
  data: MyChartData | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

export function useMyChart(): UseMyChartResult {
  const query = useQuery(myChartQueryOptions());
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? chartErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
