import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchEphemeris } from "../ephemeris/ephemeris";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import { useEphemeris } from "./useEphemeris";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../ephemeris/ephemeris", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../ephemeris/ephemeris")>()),
  fetchEphemeris: vi.fn(),
}));

const fetchMock = vi.mocked(fetchEphemeris);
const range = { from: "2026-10-26", to: "2026-11-01" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useEphemeris", () => {
  it("charge la plage demandée", async () => {
    fetchMock.mockResolvedValue({ data: sampleEphemeris, error: null });

    const { result } = renderHook(() => useEphemeris(range), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual(sampleEphemeris);
    expect(fetchMock).toHaveBeenCalledWith(range);
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ data: sampleEphemeris, error: null });

    const { result } = renderHook(() => useEphemeris(range), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.errorCode).toBeNull();
  });
});
