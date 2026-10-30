import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlacementReading from "./PlacementReading";

describe("PlacementReading", () => {
  it("donne un texte propre au signe pour le Soleil, avec la ligne pourquoi et la période", () => {
    const { rerender } = render(<PlacementReading id="t" kind="sun" sign="scorpio" degree={10.4} confidence="high" />);
    const scorpio = document.getElementById("t__text--reading")?.textContent;

    expect(scorpio).toContain("intensité");
    expect(document.getElementById("t__text--why")).toHaveTextContent(
      "le Soleil était à 10° dans la zone du Scorpion (environ du 23 octobre au 22 novembre)",
    );
    expect(document.getElementById("t__text--why")).toHaveTextContent("varient d'un jour");

    rerender(<PlacementReading id="t" kind="sun" sign="leo" degree={3} confidence="high" />);
    const leo = document.getElementById("t__text--reading")?.textContent;
    expect(leo).toContain("rayonnement");
    expect(leo).not.toBe(scorpio);
  });

  it("explique la Lune, y compris quand son signe est à confirmer", () => {
    const { rerender } = render(<PlacementReading id="t" kind="moon" sign="libra" degree={5} confidence="high" />);
    expect(document.getElementById("t__text--why")).toHaveTextContent("la Lune était à 5° dans la zone de la Balance");

    rerender(<PlacementReading id="t" kind="moon" sign="libra" degree={5} confidence="low" moonUncertain />);
    expect(document.getElementById("t__text--reading")).toBeNull();
    expect(document.getElementById("t__text--why")).toHaveTextContent("son signe reste à confirmer");
  });

  it("explique l'Ascendant et signale une heure approximative", () => {
    const { rerender } = render(<PlacementReading id="t" kind="ascendant" sign="gemini" degree={5} confidence="high" />);
    expect(document.getElementById("t__text--why")).toHaveTextContent(
      "le signe qui se levait à l'horizon était celui des Gémeaux",
    );
    expect(document.getElementById("t__text--approximate")).toBeNull();

    rerender(<PlacementReading id="t" kind="ascendant" sign="gemini" degree={5} confidence="medium" />);
    expect(document.getElementById("t__text--approximate")).toHaveTextContent("approximative");
  });
});
