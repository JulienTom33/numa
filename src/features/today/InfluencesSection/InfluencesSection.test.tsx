import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InfluencesSection from "./InfluencesSection";

describe("InfluencesSection", () => {
  it("explique la base de calcul et affiche l'amour avec les astres concernés", () => {
    render(
      <InfluencesSection
        influences={[
          { influence: "relations", level: "calm" },
          { influence: "love", level: "strong" },
          { influence: "work", level: "moderate" },
          { influence: "energy", level: "calm" },
        ]}
      />,
    );

    expect(document.getElementById("today__text--influences-basis")).toHaveTextContent("changent chaque jour");
    expect(document.getElementById("today__text--influence-love")).toHaveTextContent("Forte");
    expect(document.getElementById("today__text--influence-love-bodies")).toHaveTextContent("Vénus");
    expect(document.getElementById("today__item--influence-relations")).toBeInTheDocument();
  });
});
