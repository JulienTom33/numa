import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchMyChart } from "../skyChart/skyChart";
import { completeChart } from "../MyChart/myChartFixtures";
import { useMyChart } from "./useMyChart";
import { useNatalChartSummary } from "../useNatalChartSummary/useNatalChartSummary";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn().mockResolvedValue(null),
}));

vi.mock("../skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

const fetchMock = vi.mocked(fetchMyChart);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyChart", () => {
  it("charge puis expose le thème", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    const { result } = renderHook(() => useMyChart(), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual({ ...completeChart, summary: { ...completeChart.summary, firstName: null } });
    expect(result.current.errorCode).toBeNull();
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "birth_data_not_found" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    const { result } = renderHook(() => useMyChart(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("birth_data_not_found");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("partage le cache du thème avec le résumé", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    const wrapper = createQueryWrapper(createTestQueryClient());

    const chart = renderHook(() => useMyChart(), { wrapper });
    await waitFor(() => expect(chart.result.current.status).toBe("ready"));
    const summary = renderHook(() => useNatalChartSummary(), { wrapper });

    await waitFor(() => expect(summary.result.current.status).toBe("ready"));
    expect(summary.result.current.summary).toEqual({ ...completeChart.summary, firstName: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
