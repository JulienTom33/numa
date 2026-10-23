import { describe, expect, it } from "vitest";
import {
  normalizeDegrees,
  polarPoint,
  screenAngle,
  sectorPath,
  spreadLongitudes,
  WHEEL_CENTER,
  wheelRotation,
} from "./skyGeometry";

describe("skyGeometry", () => {
  it("normalise les angles dans [0, 360)", () => {
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(370)).toBe(10);
  });

  it("place l'Ascendant à gauche de la roue (9 h)", () => {
    const point = polarPoint(screenAngle(232.9, wheelRotation(232.9)), 100);
    expect(point.x).toBeCloseTo(WHEEL_CENTER - 100);
    expect(point.y).toBeCloseTo(WHEEL_CENTER);
  });

  it("sans Ascendant, le Bélier 0° est à gauche", () => {
    expect(wheelRotation(null)).toBe(0);
    expect(screenAngle(0, 0)).toBe(180);
  });

  it("les longitudes croissantes tournent dans le sens anti-horaire", () => {
    const below = polarPoint(screenAngle(10, 0), 100);
    expect(below.y).toBeGreaterThan(WHEEL_CENTER);
  });

  it("écarte les glyphes trop proches sans perdre l'ordre d'origine", () => {
    const spread = spreadLongitudes([100, 102, 250]);
    expect(Math.abs(spread[1] - spread[0])).toBeGreaterThanOrEqual(8.9);
    expect(spread[2]).toBeCloseTo(250);
  });

  it("laisse intactes les longitudes déjà espacées", () => {
    expect(spreadLongitudes([10, 100, 200])).toEqual([10, 100, 200]);
  });

  it("construit un secteur fermé", () => {
    const path = sectorPath(180, 210, 100, 150);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});
