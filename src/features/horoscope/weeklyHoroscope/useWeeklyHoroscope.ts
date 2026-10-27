import { queryOptions, useQuery } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import {
  fetchWeeklyHoroscope,
  WEEKLY_ERROR_CODES,
  type WeeklyErrorCode,
  type WeeklyHoroscope,
} from "./weeklyHoroscope";

export interface UseWeeklyHoroscopeResult {
  status: LoadStatus;
  data: WeeklyHoroscope | null;
  errorCode: WeeklyErrorCode | null;
  retry: () => void;
}

export function weeklyHoroscopeQueryOptions(date: string) {
  return queryOptions({
    queryKey: ["horoscope", "weekly", date] as const,
    queryFn: async () => {
      const result = await fetchWeeklyHoroscope(date);
      return unwrapResult(result.data, result.error);
    },
    retry: false,
  });
}

export function useWeeklyHoroscope(date: string, enabled = true): UseWeeklyHoroscopeResult {
  const query = useQuery({ ...weeklyHoroscopeQueryOptions(date), enabled });
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? errorCodeOf(query.error, WEEKLY_ERROR_CODES, "network_error") : null,
    retry: () => {
      void refetch();
    },
  };
}
