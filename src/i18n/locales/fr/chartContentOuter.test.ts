import { describe, expect, it } from "vitest";
import outer from "./chartSignsOuter.json";

const BODIES = ["jupiter", "saturn", "uranus", "neptune", "pluto"];
const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];
const FORBIDDEN = ["vous allez", "vous serez", "sans aucun doute"];

const content = outer as Record<string, Record<string, string>>;

describe("chartSignsOuter.json", () => {
  it("contient les 5 planètes et uniquement elles", () => {
    expect(Object.keys(content).sort()).toEqual([...BODIES].sort());
  });

  it.each(BODIES)("couvre les 12 signes pour %s", (body) => {
    expect(Object.keys(content[body]).sort()).toEqual([...SIGNS].sort());
  });

  it("contient 60 textes non vides et distincts", () => {
    const texts = BODIES.flatMap((body) => SIGNS.map((sign) => content[body][sign]));
    expect(texts).toHaveLength(60);
    texts.forEach((text) => expect(text.trim().length).toBeGreaterThan(40));
    expect(new Set(texts).size).toBe(60);
  });

  it("n'emploie aucune formulation catégorique", () => {
    BODIES.forEach((body) =>
      SIGNS.forEach((sign) => {
        const text = content[body][sign].toLowerCase();
        FORBIDDEN.forEach((phrase) => expect(text).not.toContain(phrase));
      }),
    );
  });
});
