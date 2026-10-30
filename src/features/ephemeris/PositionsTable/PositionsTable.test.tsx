import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import PositionsTable from "./PositionsTable";

describe("PositionsTable", () => {
  it("affiche un vrai tableau avec légende et en-têtes", () => {
    render(<PositionsTable day={sampleEphemeris.days[4]} />);

    const table = screen.getByRole("table");
    expect(within(table).getByText(/calculées à midi UTC, soit 13 h ou 14 h à Paris/)).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader")).toHaveLength(5);
    expect(within(table).getAllByRole("row")).toHaveLength(11);
  });

  it("affiche signe, degré, minute, mouvement et vitesse", () => {
    render(<PositionsTable day={sampleEphemeris.days[4]} />);

    const moon = screen.getByRole("row", { name: /Lune/ });
    expect(moon).toHaveTextContent("Gémeaux");
    expect(moon).toHaveTextContent("24°42′");
    expect(moon).toHaveTextContent("directe");
    expect(moon).toHaveTextContent("13,2 °/jour");
  });

  it("signale les astres rétrogrades", () => {
    render(<PositionsTable day={sampleEphemeris.days[4]} />);

    expect(screen.getByRole("row", { name: /Mercure/ })).toHaveTextContent("rétrograde");
  });
});
