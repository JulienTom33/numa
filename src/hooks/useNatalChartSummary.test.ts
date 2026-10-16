import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeSummary } from "../screens/ChartSummary/chartSummaryFixtures";
import { fetchNatalChartSummary } from "../lib/natalChartSummary";
import { useNatalChartSummary } from "./useNatalChartSummary";

vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../lib/natalChartSummary", () => ({ fetchNatalChartSummary: vi.fn() }));

const fetchMock = vi.mocked(fetchNatalChartSummary);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useNatalChartSummary", () => {
  it("charge puis expose le résumé", async () => {
    fetchMock.mockResolvedValue({ summary: completeSummary, error: null });

    const { result } = renderHook(() => useNatalChartSummary());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary).toEqual(completeSummary);
    expect(result.current.errorCode).toBeNull();
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ summary: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ summary: completeSummary, error: null });

    const { result } = renderHook(() => useNatalChartSummary());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.errorCode).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
