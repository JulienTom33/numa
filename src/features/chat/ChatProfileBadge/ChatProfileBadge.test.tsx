import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { completeSummary, unknownTimeSummary } from "../../chart/ChartSummary/chartSummaryFixtures";
import ChatProfileBadge from "./ChatProfileBadge";

describe("ChatProfileBadge", () => {
  it("affiche le profil utilisé", () => {
    render(<ChatProfileBadge summary={completeSummary} />);
    expect(
      screen.getByText("Profil analysé : Camille · Soleil en Taureau · Lune en Cancer · Ascendant en Scorpion"),
    ).toBeInTheDocument();
  });

  it("omet l'ascendant quand il n'est pas calculé", () => {
    render(<ChatProfileBadge summary={unknownTimeSummary} />);
    expect(screen.queryByText(/Ascendant/)).not.toBeInTheDocument();
  });

  it("indique le chargement sans profil", () => {
    render(<ChatProfileBadge summary={null} />);
    expect(screen.getByText("Profil analysé : en cours de chargement")).toBeInTheDocument();
  });
});
