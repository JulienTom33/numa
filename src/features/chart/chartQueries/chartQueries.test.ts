import { describe, expect, it, vi } from "vitest";
import { CodedQueryError } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import { chartErrorCode, myChartQueryOptions } from "./chartQueries";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

describe("chartErrorCode", () => {
  it("conserve les codes des Edge Functions", () => {
    expect(chartErrorCode(new CodedQueryError("birth_data_not_found"))).toBe("birth_data_not_found");
    expect(chartErrorCode(new CodedQueryError("network_error"))).toBe("network_error");
  });

  it("ramène tout le reste à internal_error", () => {
    expect(chartErrorCode(new CodedQueryError("inconnu"))).toBe("internal_error");
    expect(chartErrorCode(new Error("x"))).toBe("internal_error");
  });
});

describe("myChartQueryOptions", () => {
  it("utilise la clé du thème du domaine chart", () => {
    expect(myChartQueryOptions().queryKey).toEqual(queryKeys.chart.mine());
  });
});
