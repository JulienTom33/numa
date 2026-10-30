import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SourceCard from "./SourceCard";

describe("SourceCard", () => {
  it("cite le moteur, la vérification JPL Horizons et l'absence de prédiction", () => {
    render(<SourceCard engine={{ name: "astronomy-engine", version: "2.1.19" }} />);

    expect(document.getElementById("ephemeris__text--source")).toHaveTextContent("astronomy-engine 2.1.19");
    expect(document.getElementById("ephemeris__text--source-precision")).toHaveTextContent("JPL Horizons");
    expect(document.getElementById("ephemeris__text--source-not-prediction")).toHaveTextContent("pas des prédictions");
  });
});
