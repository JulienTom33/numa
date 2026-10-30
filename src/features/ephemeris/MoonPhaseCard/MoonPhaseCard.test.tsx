import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MoonPhaseCard from "./MoonPhaseCard";

describe("MoonPhaseCard", () => {
  it("affiche le nom français, l'illumination et l'âge", () => {
    render(<MoonPhaseCard moon={{ name: "waxing_gibbous", angle: 140, illumination: 0.87, age: 10.4 }} />);

    expect(document.getElementById("ephemeris__text--moon-name")).toHaveTextContent("Lune gibbeuse croissante");
    expect(document.getElementById("ephemeris__text--moon-illumination")).toHaveTextContent("87");
    expect(document.getElementById("ephemeris__text--moon-age")).toHaveTextContent("10,4 jours");
  });
});
