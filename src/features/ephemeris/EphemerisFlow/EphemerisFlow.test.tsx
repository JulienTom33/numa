import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paths } from "../../../shared/navigation/routes/routes";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchEphemeris } from "../ephemeris/ephemeris";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import EphemerisFlow from "./EphemerisFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../ephemeris/ephemeris", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../ephemeris/ephemeris")>()),
  fetchEphemeris: vi.fn(),
}));

const fetchMock = vi.mocked(fetchEphemeris);
const fixedNow = () => new Date("2026-10-30T09:00:00Z");

function renderFlow() {
  const Wrapper = createQueryWrapper();
  render(
    <Wrapper>
      <MemoryRouter initialEntries={[paths.ephemeris]}>
        <Routes>
          <Route path={paths.ephemeris} element={<EphemerisFlow now={fixedNow} />} />
          <Route path={paths.today} element={<p id="test__text--today">aujourdhui</p>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({ data: sampleEphemeris, error: null });
});

describe("EphemerisFlow", () => {
  it("charge le jour courant UTC puis la semaine du lundi au dimanche", async () => {
    renderFlow();

    await waitFor(() => expect(document.getElementById("ephemeris__card--positions")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith({ from: "2026-10-30", to: "2026-10-30" });

    await userEvent.click(screen.getByRole("radio", { name: "Semaine" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith({ from: "2026-10-26", to: "2026-11-01" }));

    await userEvent.click(screen.getByRole("radio", { name: "Mois" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith({ from: "2026-10-01", to: "2026-10-31" }));
  });

  it("navigue vers la période suivante puis revient à aujourd'hui", async () => {
    renderFlow();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole("button", { name: "Période suivante" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith({ from: "2026-10-31", to: "2026-10-31" }));

    await userEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));
    expect(document.getElementById("ephemeris__text--range")).toHaveTextContent("30 octobre 2026");
  });

  it("revient à l'écran Aujourd'hui", async () => {
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: "Retour à Aujourd'hui" }));

    expect(document.getElementById("test__text--today")).toBeInTheDocument();
  });
});
