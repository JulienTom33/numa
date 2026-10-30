import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchMonthlyHoroscope, type MonthlyHoroscope } from "./monthlyHoroscope";
import { useMonthlyHoroscope } from "./useMonthlyHoroscope";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("./monthlyHoroscope", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./monthlyHoroscope")>()),
  fetchMonthlyHoroscope: vi.fn(),
}));

const fetchMock = vi.mocked(fetchMonthlyHoroscope);

const SAMPLE: MonthlyHoroscope = {
  monthStart: "2026-10-01",
  monthEnd: "2026-10-31",
  sections: { general: "G", relations: "R", work: "W", energy: "E" },
  basis: { ascendantKnown: true, events: [], aspects: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMonthlyHoroscope", () => {
  it("charge la lecture du mois contenant la date", async () => {
    fetchMock.mockResolvedValue({ data: SAMPLE, error: null });

    const { result } = renderHook(() => useMonthlyHoroscope("2026-10-27"), { wrapper: createQueryWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual(SAMPLE);
    expect(fetchMock).toHaveBeenCalledWith("2026-10-27");
  });

  it("expose le code d'erreur", async () => {
    fetchMock.mockResolvedValue({ data: null, error: "birth_data_not_found" });

    const { result } = renderHook(() => useMonthlyHoroscope("2026-10-27"), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("birth_data_not_found");
  });

  it("n'appelle pas le serveur quand il est désactivé", () => {
    renderHook(() => useMonthlyHoroscope("2026-10-27", false), { wrapper: createQueryWrapper() });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
