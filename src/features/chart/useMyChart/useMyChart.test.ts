import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyChart } from "../skyChart/skyChart";
import { completeChart } from "../MyChart/myChartFixtures";
import { useMyChart } from "./useMyChart";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

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

    const { result } = renderHook(() => useMyChart());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual(completeChart);
    expect(result.current.errorCode).toBeNull();
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    const { result } = renderHook(() => useMyChart());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignore une réponse reçue après le démontage", async () => {
    let resolve: (value: Awaited<ReturnType<typeof fetchMyChart>>) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise((done) => (resolve = done)));

    const { result, unmount } = renderHook(() => useMyChart());
    unmount();
    resolve({ data: completeChart, error: null });

    expect(result.current.status).toBe("loading");
  });
});
