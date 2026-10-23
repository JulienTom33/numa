import { describe, expect, it } from "vitest";
import { ascendantsDiffer } from "./ascendant";

describe("ascendantsDiffer", () => {
  it("détecte un écart entre le signe calculé et le signe déclaré", () => {
    expect(ascendantsDiffer({ sign: "leo", degreeInSign: 4 }, "virgo")).toBe(true);
  });

  it("ne signale pas d'écart pour un même signe", () => {
    expect(ascendantsDiffer({ sign: "leo", degreeInSign: 4 }, "leo")).toBe(false);
  });

  it("ne signale pas d'écart sans calcul ou sans signe déclaré", () => {
    expect(ascendantsDiffer(null, "leo")).toBe(false);
    expect(ascendantsDiffer({ sign: "leo", degreeInSign: 4 }, null)).toBe(false);
  });
});
