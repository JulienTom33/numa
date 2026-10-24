import { queryOptions } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import { readFirstName } from "../natalChartSummary/natalChartSummary";
import { fetchMyChart, type MyChartData } from "../skyChart/skyChart";

export const NATAL_CHART_ERROR_CODES: readonly NatalChartErrorCode[] = [
  "unauthenticated",
  "birth_data_not_found",
  "invalid_birth_data",
  "network_error",
  "internal_error",
];

export function chartErrorCode(error: unknown): NatalChartErrorCode {
  return errorCodeOf(error, NATAL_CHART_ERROR_CODES, "internal_error");
}

async function fetchChartWithFirstName(): Promise<MyChartData> {
  const result = await fetchMyChart();
  const chart = unwrapResult(result.data, result.error);
  const firstName = await readFirstName().catch(() => null);
  return { ...chart, summary: { ...chart.summary, firstName } };
}

export function myChartQueryOptions() {
  return queryOptions({ queryKey: queryKeys.chart.mine(), queryFn: fetchChartWithFirstName });
}
