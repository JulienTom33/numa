import { queryOptions, useQuery } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import {
  fetchHoroscope,
  HOROSCOPE_ERROR_CODES,
  type Horoscope,
  type HoroscopeErrorCode,
} from "../horoscope/horoscope";

export interface UseHoroscopeResult {
  status: LoadStatus;
  data: Horoscope | null;
  errorCode: HoroscopeErrorCode | null;
  retry: () => void;
}

export function horoscopeQueryOptions(date: string) {
  return queryOptions({
    queryKey: ["horoscope", "daily", date] as const,
    queryFn: async () => {
      const result = await fetchHoroscope(date);
      return unwrapResult(result.data, result.error);
    },
    retry: false,
  });
}

export function useHoroscope(date: string): UseHoroscopeResult {
  const query = useQuery(horoscopeQueryOptions(date));
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? errorCodeOf(query.error, HOROSCOPE_ERROR_CODES, "network_error") : null,
    retry: () => {
      void refetch();
    },
  };
}
