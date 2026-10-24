import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { completeChart } from "../MyChart/myChartFixtures";
import { fetchMyChart } from "../skyChart/skyChart";
import { readFirstName } from "../natalChartSummary/natalChartSummary";
import { useNatalChartSummary } from "./useNatalChartSummary";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn(),
}));

vi.mock("../skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

const fetchMock = vi.mocked(fetchMyChart);
const firstNameMock = vi.mocked(readFirstName);

beforeEach(() => {
  vi.clearAllMocks();
  firstNameMock.mockResolvedValue("Julie");
});

describe("useNatalChartSummary", () => {
  it("charge puis expose le résumé avec le prénom", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    const { result } = renderHook(() => useNatalChartSummary(), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary).toEqual({ ...completeChart.summary, firstName: "Julie" });
    expect(result.current.errorCode).toBeNull();
  });

  it("ignore l'échec de lecture du prénom", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    firstNameMock.mockRejectedValue(new Error("rls"));

    const { result } = renderHook(() => useNatalChartSummary(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary?.firstName).toBeNull();
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "invalid_birth_data" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    const { result } = renderHook(() => useNatalChartSummary(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("invalid_birth_data");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.errorCode).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
