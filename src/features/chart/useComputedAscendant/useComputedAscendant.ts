import { useQuery } from "@tanstack/react-query";
import { unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import type { ComputedAscendant } from "../ascendant/ascendant";
import { chartErrorCode } from "../chartQueries/chartQueries";
import { fetchComputedAscendant, type NatalChartErrorCode } from "../natalChart/natalChart";

export type ComputedAscendantStatus = "idle" | "loading" | "ready" | "error";

export interface UseComputedAscendantResult {
  status: ComputedAscendantStatus;
  ascendant: ComputedAscendant | null;
  errorCode: NatalChartErrorCode | null;
  retry: () => void;
}

async function loadAscendant(): Promise<{ ascendant: ComputedAscendant | null }> {
  const result = await fetchComputedAscendant();
  return unwrapResult({ ascendant: result.ascendant }, result.error);
}

function statusOf(enabled: boolean, isSuccess: boolean, isError: boolean, isFetching: boolean): ComputedAscendantStatus {
  if (!enabled) return "idle";
  if (isSuccess) return "ready";
  if (isError && !isFetching) return "error";
  return "loading";
}

export function useComputedAscendant(enabled: boolean, refreshKey: string | null): UseComputedAscendantResult {
  const query = useQuery({
    queryKey: queryKeys.chart.ascendant(refreshKey),
    queryFn: loadAscendant,
    enabled,
  });
  const { refetch } = query;

  return {
    status: statusOf(enabled, query.isSuccess, query.isError, query.isFetching),
    ascendant: enabled ? (query.data?.ascendant ?? null) : null,
    errorCode: enabled && query.isError ? chartErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
