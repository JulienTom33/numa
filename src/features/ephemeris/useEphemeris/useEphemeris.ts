import { queryOptions, useQuery } from "@tanstack/react-query";
import { EPHEMERIS_ERROR_CODES } from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { fetchEphemeris, type Ephemeris, type EphemerisErrorCode } from "../ephemeris/ephemeris";
import type { DateRange } from "../ephemerisPeriod/ephemerisPeriod";

export interface UseEphemerisResult {
  status: LoadStatus;
  data: Ephemeris | null;
  errorCode: EphemerisErrorCode | null;
  retry: () => void;
}

export function ephemerisQueryOptions({ from, to }: DateRange) {
  return queryOptions({
    queryKey: ["ephemeris", from, to] as const,
    queryFn: async () => {
      const result = await fetchEphemeris({ from, to });
      return unwrapResult(result.data, result.error);
    },
    retry: false,
  });
}

export function useEphemeris(range: DateRange): UseEphemerisResult {
  const query = useQuery(ephemerisQueryOptions(range));
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? errorCodeOf(query.error, EPHEMERIS_ERROR_CODES, "network_error") : null,
    retry: () => {
      void refetch();
    },
  };
}
