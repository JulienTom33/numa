import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchHoroscope } from "../horoscope/horoscope";
import { sampleHoroscope } from "../HoroscopeCard/horoscopeFixtures";
import { useHoroscope } from "./useHoroscope";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../horoscope/horoscope", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../horoscope/horoscope")>()),
  fetchHoroscope: vi.fn(),
}));

const fetchMock = vi.mocked(fetchHoroscope);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useHoroscope", () => {
  it("charge la lecture de la date demandée", async () => {
    fetchMock.mockResolvedValue({ data: sampleHoroscope, error: null });

    const { result } = renderHook(() => useHoroscope("2026-10-27"), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual(sampleHoroscope);
    expect(fetchMock).toHaveBeenCalledWith("2026-10-27");
  });

  it("n'appelle pas le serveur tant que la requête est désactivée", () => {
    const { result } = renderHook(() => useHoroscope("2026-10-27", false), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("expose le code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "ai_unavailable" });
    fetchMock.mockResolvedValueOnce({ data: sampleHoroscope, error: null });

    const { result } = renderHook(() => useHoroscope("2026-10-27"), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("ai_unavailable");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
