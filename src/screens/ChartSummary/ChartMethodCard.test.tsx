import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChartMethodCard from "./ChartMethodCard";
import { completeSummary, unknownTimeSummary } from "./chartSummaryFixtures";

describe("ChartMethodCard", () => {
  it("dérive ses identifiants du préfixe fourni", () => {
    render(<ChartMethodCard idPrefix="demo" summary={completeSummary} />);

    expect(document.getElementById("demo__value--houses")).toHaveTextContent("Placidus");
    expect(document.getElementById("demo__value--computed-at")).toHaveTextContent("16 octobre 2026");
  });

  it("indique les maisons non calculées et masque la date absente", () => {
    render(<ChartMethodCard idPrefix="demo" summary={{ ...unknownTimeSummary, computedAt: null }} />);

    expect(document.getElementById("demo__value--houses")).toHaveTextContent("Non calculées");
    expect(document.getElementById("demo__value--computed-at")).toBeNull();
  });
});
