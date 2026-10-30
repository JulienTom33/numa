import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import EphemerisScreen from "./EphemerisScreen";

type ScreenProps = Parameters<typeof EphemerisScreen>[0];

function renderScreen(overrides: Partial<ScreenProps> = {}) {
  const props: ScreenProps = {
    status: "ready",
    data: sampleEphemeris,
    period: "week",
    range: { from: "2026-10-26", to: "2026-11-01" },
    selectedDay: "2026-10-30",
    onBack: vi.fn(),
    onPeriodChange: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
    onSelectDay: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
  render(<EphemerisScreen {...props} />);
  return props;
}

describe("EphemerisScreen", () => {
  it("affiche les cinq sections et la mention d'heure", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1, name: "Éphéméride" })).toBeInTheDocument();
    for (const id of ["positions", "moon", "aspects", "events", "source"]) {
      expect(document.getElementById(`ephemeris__card--${id}`)).toBeInTheDocument();
    }
    expect(document.getElementById("ephemeris__text--utc")).toHaveTextContent("heure de Paris");
  });

  it("revient à Aujourd'hui", async () => {
    const props = renderScreen();

    await userEvent.click(screen.getByRole("button", { name: "Retour à Aujourd'hui" }));

    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("propose le choix du jour en semaine et pas en vue jour", async () => {
    const props = renderScreen();

    await userEvent.selectOptions(screen.getByLabelText("Jour affiché"), "2026-10-28");

    expect(props.onSelectDay).toHaveBeenCalledWith("2026-10-28");
  });

  it("masque le choix du jour en vue jour", () => {
    renderScreen({ period: "day", range: { from: "2026-10-30", to: "2026-10-30" } });

    expect(screen.queryByLabelText("Jour affiché")).not.toBeInTheDocument();
  });

  it("indique le chargement", () => {
    renderScreen({ status: "loading", data: null });

    expect(document.getElementById("ephemeris__status--loading")).toBeInTheDocument();
  });

  it("affiche l'erreur et permet de réessayer", async () => {
    const props = renderScreen({ status: "error", data: null });

    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("affiche l'état vide", () => {
    renderScreen({ data: { ...sampleEphemeris, days: [] } });

    expect(document.getElementById("ephemeris__empty--root")).toBeInTheDocument();
  });
});
