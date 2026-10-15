import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlanetTrio from "./PlanetTrio";

describe("PlanetTrio", () => {
  it("renders sun, moon and ascendant as a description list", () => {
    render(
      <PlanetTrio
        id="test__trio--main"
        sun={{ sign: "Gémeaux" }}
        moon={{ sign: "Poissons" }}
        ascendant={{ sign: "Balance", detail: "12° 34′" }}
      />,
    );
    const terms = screen.getAllByRole("term");

    expect(terms.map((term) => term.textContent)).toEqual(["Soleil", "Lune", "Ascendant"]);
    expect(screen.getByText("Gémeaux")).toBeInTheDocument();
    expect(screen.getByText("Poissons")).toBeInTheDocument();
    expect(screen.getByText("12° 34′")).toBeInTheDocument();
  });

  it("shows the unknown label when the ascendant is not known", () => {
    render(
      <PlanetTrio
        id="test__trio--main"
        sun={{ sign: "Gémeaux" }}
        moon={{ sign: "Poissons" }}
        ascendant={null}
        unknownLabel="Heure inconnue"
      />,
    );
    const ascendant = screen.getByText("Ascendant").parentElement;
    if (!ascendant) throw new Error("ascendant item not rendered");

    expect(within(ascendant).getByText("Heure inconnue")).toBeInTheDocument();
  });
});
