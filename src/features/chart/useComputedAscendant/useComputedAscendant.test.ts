import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchComputedAscendant } from "../natalChart/natalChart";
import { useComputedAscendant } from "./useComputedAscendant";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChart/natalChart", () => ({ fetchComputedAscendant: vi.fn() }));

const fetchMock = vi.mocked(fetchComputedAscendant);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useComputedAscendant", () => {
  it("reste inactif tant qu'il n'est pas activé", () => {
    const { result } = renderHook(() => useComputedAscendant(false, null));

    expect(result.current.status).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("charge puis expose l'ascendant calculé", async () => {
    fetchMock.mockResolvedValue({ ascendant: { sign: "libra", degreeInSign: 12.3 }, confidence: "high", error: null });

    const { result } = renderHook(() => useComputedAscendant(true, "bd-1"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.ascendant).toEqual({ sign: "libra", degreeInSign: 12.3 });
  });

  it("expose un code d'erreur puis réessaie", async () => {
    fetchMock.mockResolvedValueOnce({ ascendant: null, confidence: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({
      ascendant: { sign: "leo", degreeInSign: 1 },
      confidence: "high",
      error: null,
    });

    const { result } = renderHook(() => useComputedAscendant(true, "bd-1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.errorCode).toBeNull();
    expect(result.current.ascendant?.sign).toBe("leo");
  });

  it("relance le calcul quand les données de naissance changent", async () => {
    fetchMock.mockResolvedValue({ ascendant: null, confidence: "low", error: null });

    const { result, rerender } = renderHook(({ key }) => useComputedAscendant(true, key), {
      initialProps: { key: "bd-1" },
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ key: "bd-2" });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
