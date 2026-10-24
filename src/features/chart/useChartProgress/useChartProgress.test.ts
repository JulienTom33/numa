import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import { streamNatalChart } from "../natalChartProgress/natalChartProgress";
import type { ChartPhase } from "../../../../shared/contracts/natalChart/natalChart.ts";
import { useChartProgress } from "./useChartProgress";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChartProgress/natalChartProgress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../natalChartProgress/natalChartProgress")>()),
  streamNatalChart: vi.fn(),
}));

const streamMock = vi.mocked(streamNatalChart);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useChartProgress", () => {
  it("avance au rythme des phases reçues puis passe à done", async () => {
    let emit: (phase: ChartPhase) => void = () => undefined;
    let finish: (error: null) => void = () => undefined;
    streamMock.mockImplementation((onPhase) => {
      emit = onPhase;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });

    const { result } = renderHook(() => useChartProgress(), { wrapper: createQueryWrapper() });
    expect(result.current).toMatchObject({ completedCount: 0, status: "loading" });
    await waitFor(() => expect(streamMock).toHaveBeenCalled());

    act(() => emit("validation"));
    act(() => emit("positions"));
    expect(result.current.completedCount).toBe(3);
    expect(result.current.status).toBe("loading");

    await act(async () => finish(null));
    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.completedCount).toBe(6);
  });

  it("expose le code d'erreur et permet de réessayer", async () => {
    streamMock.mockResolvedValueOnce("network_error").mockResolvedValueOnce(null);

    const { result } = renderHook(() => useChartProgress(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.errorCode).toBeNull();
    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it("invalide le cache du thème une fois le calcul terminé", async () => {
    streamMock.mockResolvedValue(null);
    const client = createTestQueryClient();
    client.setQueryData(queryKeys.chart.mine(), { stale: true });

    const { result } = renderHook(() => useChartProgress(), { wrapper: createQueryWrapper(client) });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(client.getQueryState(queryKeys.chart.mine())?.isInvalidated).toBe(true);
  });

  it("annule le flux et ignore ses événements au démontage", async () => {
    let signal: AbortSignal | undefined;
    let emit: (phase: ChartPhase) => void = () => undefined;
    streamMock.mockImplementation((onPhase, abortSignal) => {
      emit = onPhase;
      signal = abortSignal;
      return new Promise(() => undefined);
    });

    const { result, unmount } = renderHook(() => useChartProgress(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(streamMock).toHaveBeenCalled());
    unmount();

    expect(signal?.aborted).toBe(true);
    act(() => emit("validation"));
    expect(result.current.completedCount).toBe(0);
  });
});
