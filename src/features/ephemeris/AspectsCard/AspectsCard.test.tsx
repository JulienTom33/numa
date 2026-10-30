import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import AspectsCard from "./AspectsCard";

describe("AspectsCard", () => {
  it("limite aux aspects les plus serrés puis permet de tout voir", async () => {
    render(<AspectsCard aspects={sampleEphemeris.days[4].aspects} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Conjonction · Soleil et Mercure");
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("écart 0,8°");

    await userEvent.click(screen.getByRole("button", { name: "Voir tout (8)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);

    await userEvent.click(screen.getByRole("button", { name: "Réduire la liste" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("n'affiche pas le bouton pour une liste courte", () => {
    render(<AspectsCard aspects={sampleEphemeris.days[1].aspects} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("indique l'absence d'aspect", () => {
    render(<AspectsCard aspects={[]} />);

    expect(document.getElementById("ephemeris__text--aspects-none")).toBeInTheDocument();
  });
});
