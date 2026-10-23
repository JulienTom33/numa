import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SkyChartCard from "./SkyChartCard";
import { completeNatal, unknownTimeNatal } from "../MyChart/myChartFixtures";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

describe("SkyChartCard", () => {
  it("est replié par défaut et se déplie au clavier", async () => {
    const user = userEvent.setup();
    render(<SkyChartCard natal={completeNatal} />);

    const toggle = screen.getByRole("button", { name: "Afficher la carte du ciel" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("my-chart__wheel--sky")).not.toBeVisible();

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("my-chart__wheel--sky")).toBeVisible();
  });

  it("fournit légende et tableau de positions comme alternative textuelle", () => {
    render(<SkyChartCard natal={completeNatal} defaultOpen />);

    expect(document.querySelectorAll("[id^='my-chart__item--legend-sign-']")).toHaveLength(12);
    expect(document.querySelectorAll("[id^='my-chart__item--legend-body-']")).toHaveLength(10);
    const table = screen.getByRole("table", { name: "Positions des planètes à la naissance" });
    const jupiter = within(table).getByText("Jupiter").closest("tr") as HTMLElement;
    expect(within(jupiter).getByText("Rétrograde")).toBeInTheDocument();
    expect(within(table).getAllByText("Directe")).toHaveLength(9);
  });

  it("sans heure : message explicatif et maisons non calculées", () => {
    render(<SkyChartCard natal={unknownTimeNatal} defaultOpen />);

    expect(document.getElementById("my-chart__text--sky-no-houses")).toHaveTextContent("Sans heure de naissance");
    expect(screen.getAllByText("Non calculée")).toHaveLength(10);
  });
});
