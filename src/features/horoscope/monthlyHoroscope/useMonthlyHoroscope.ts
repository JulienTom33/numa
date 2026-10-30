import { queryOptions, useQuery } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import {
  fetchMonthlyHoroscope,
  MONTHLY_ERROR_CODES,
  type MonthlyErrorCode,
  type MonthlyHoroscope,
} from "./monthlyHoroscope";

export interface UseMonthlyHoroscopeResult {
  status: LoadStatus;
  data: MonthlyHoroscope | null;
  errorCode: MonthlyErrorCode | null;
  retry: () => void;
}

export function monthlyHoroscopeQueryOptions(date: string) {
  return queryOptions({
    queryKey: ["horoscope", "monthly", date] as const,
    queryFn: async () => {
      const result = await fetchMonthlyHoroscope(date);
      return unwrapResult(result.data, result.error);
    },
    retry: false,
  });
}

export function useMonthlyHoroscope(date: string, enabled = true): UseMonthlyHoroscopeResult {
  const query = useQuery({ ...monthlyHoroscopeQueryOptions(date), enabled });
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? errorCodeOf(query.error, MONTHLY_ERROR_CODES, "network_error") : null,
    retry: () => {
      void refetch();
    },
  };
}
