import { describe, expect, it } from "vitest";
import chartHouses from "./chartHouses.json";
import chartSignsPersonal from "./chartSignsPersonal.json";

const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const PLANETS = ["mercury", "venus", "mars"];
const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
const FORBIDDEN = [/vous allez/i, /vous serez/i, /sans aucun doute/i];

const signs: Record<string, Record<string, string>> = chartSignsPersonal;
const houses: Record<string, string> = chartHouses;

const signTexts = PLANETS.flatMap((planet) => SIGNS.map((sign) => ({ key: `${planet}.${sign}`, text: signs[planet]?.[sign] ?? "" })));
const houseTexts = HOUSES.map((house) => ({ key: `maison ${house}`, text: houses[house] ?? "" }));

describe("contenu personnalisé du thème", () => {
  it("couvre toutes les planètes et tous les signes", () => {
    expect(Object.keys(signs).sort()).toEqual([...PLANETS].sort());
    for (const planet of PLANETS) {
      expect(Object.keys(signs[planet]).sort()).toEqual([...SIGNS].sort());
    }
  });

  it("couvre les 12 maisons", () => {
    expect(Object.keys(houses).sort()).toEqual([...HOUSES].sort());
  });

  it.each([...signTexts, ...houseTexts])("texte $key non vide et non catégorique", ({ text }) => {
    expect(text.trim().length).toBeGreaterThan(40);
    for (const pattern of FORBIDDEN) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("n'a aucun texte en double", () => {
    const all = [...signTexts, ...houseTexts].map((entry) => entry.text);
    expect(new Set(all).size).toBe(all.length);
  });
});
