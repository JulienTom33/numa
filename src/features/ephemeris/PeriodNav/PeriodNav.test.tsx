import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PeriodNav from "./PeriodNav";

function renderNav(period: "day" | "week" | "month", range: { from: string; to: string }) {
  const handlers = {
    onPeriodChange: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
  };
  render(<PeriodNav period={period} range={range} {...handlers} />);
  return handlers;
}

describe("PeriodNav", () => {
  it("affiche et annonce le jour courant", () => {
    renderNav("day", { from: "2026-10-30", to: "2026-10-30" });

    expect(document.getElementById("ephemeris__text--range")).toHaveTextContent("vendredi 30 octobre 2026");
    expect(screen.getByRole("status")).toHaveTextContent("Période affichée : vendredi 30 octobre 2026.");
  });

  it("affiche une semaine et un mois", () => {
    const { rerender } = render(
      <PeriodNav
        period="week"
        range={{ from: "2026-10-26", to: "2026-11-01" }}
        onPeriodChange={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );
    expect(document.getElementById("ephemeris__text--range")).toHaveTextContent("26 octobre 2026 – 1 novembre 2026");

    rerender(
      <PeriodNav
        period="month"
        range={{ from: "2026-10-01", to: "2026-10-31" }}
        onPeriodChange={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );
    expect(document.getElementById("ephemeris__text--range")).toHaveTextContent("octobre 2026");
  });

  it("déclenche précédent, suivant, aujourd'hui et le changement de durée", async () => {
    const handlers = renderNav("day", { from: "2026-10-30", to: "2026-10-30" });

    await userEvent.click(screen.getByRole("button", { name: "Période précédente" }));
    await userEvent.click(screen.getByRole("button", { name: "Période suivante" }));
    await userEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));
    await userEvent.click(screen.getByRole("radio", { name: "Semaine" }));

    expect(handlers.onPrevious).toHaveBeenCalledTimes(1);
    expect(handlers.onNext).toHaveBeenCalledTimes(1);
    expect(handlers.onToday).toHaveBeenCalledTimes(1);
    expect(handlers.onPeriodChange).toHaveBeenCalledWith("week");
  });
});
