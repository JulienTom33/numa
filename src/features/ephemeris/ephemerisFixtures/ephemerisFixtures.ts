import type { EphemerisDay } from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import type { Ephemeris } from "../ephemeris/ephemeris";

const bodies: EphemerisDay["bodies"] = [
  { body: "sun", longitude: 217.4, sign: "scorpio", degreeInSign: 7.4, retrograde: false, speed: 0.99 },
  { body: "moon", longitude: 84.7, sign: "gemini", degreeInSign: 24.7, retrograde: false, speed: 13.2 },
  { body: "mercury", longitude: 225.1, sign: "scorpio", degreeInSign: 15.1, retrograde: true, speed: -0.4 },
  { body: "venus", longitude: 190.3, sign: "libra", degreeInSign: 10.3, retrograde: false, speed: 1.1 },
  { body: "mars", longitude: 120.9, sign: "leo", degreeInSign: 0.9, retrograde: false, speed: 0.7 },
  { body: "jupiter", longitude: 110, sign: "cancer", degreeInSign: 20, retrograde: false, speed: 0.1 },
  { body: "saturn", longitude: 356.2, sign: "pisces", degreeInSign: 26.2, retrograde: true, speed: -0.05 },
  { body: "uranus", longitude: 60.5, sign: "gemini", degreeInSign: 0.5, retrograde: false, speed: 0.02 },
  { body: "neptune", longitude: 1.2, sign: "aries", degreeInSign: 1.2, retrograde: false, speed: 0.01 },
  { body: "pluto", longitude: 303.4, sign: "aquarius", degreeInSign: 3.4, retrograde: false, speed: 0.01 },
];

function day(date: string, aspectCount: number): EphemerisDay {
  const aspectPool: EphemerisDay["aspects"] = [
    { bodyA: "sun", bodyB: "mercury", type: "conjunction", exactAngle: 0, orb: 0.8 },
    { bodyA: "moon", bodyB: "venus", type: "trine", exactAngle: 120, orb: 1.4 },
    { bodyA: "mars", bodyB: "saturn", type: "square", exactAngle: 90, orb: 2.2 },
    { bodyA: "sun", bodyB: "jupiter", type: "sextile", exactAngle: 60, orb: 3.1 },
    { bodyA: "venus", bodyB: "pluto", type: "opposition", exactAngle: 180, orb: 4.5 },
    { bodyA: "moon", bodyB: "mars", type: "sextile", exactAngle: 60, orb: 4.9 },
    { bodyA: "mercury", bodyB: "uranus", type: "square", exactAngle: 90, orb: 5.6 },
    { bodyA: "sun", bodyB: "neptune", type: "trine", exactAngle: 120, orb: 6.3 },
  ];
  return {
    date,
    instant: `${date}T12:00:00.000Z`,
    bodies,
    moon: { name: "waxing_gibbous", angle: 140, illumination: 0.87, age: 10.4 },
    aspects: aspectPool.slice(0, aspectCount),
  };
}

export const sampleEphemeris: Ephemeris = {
  schemaVersion: 1,
  engine: { name: "astronomy-engine", version: "2.1.19" },
  range: { from: "2026-10-26", to: "2026-11-01", days: 7 },
  days: [
    day("2026-10-26", 8),
    day("2026-10-27", 3),
    day("2026-10-28", 3),
    day("2026-10-29", 3),
    day("2026-10-30", 8),
    day("2026-10-31", 3),
    day("2026-11-01", 0),
  ],
  events: {
    ingresses: [{ body: "venus", from: "libra", to: "scorpio", retrograde: false, at: "2026-10-30T10:15:00Z" }],
    stations: [{ body: "mercury", type: "retrograde", sign: "scorpio", longitude: 225, at: "2026-10-28T08:00:00Z" }],
    moonPhases: [{ phase: "full_moon", at: "2026-10-29T12:30:00Z" }],
    eclipses: [{ body: "lunar", kind: "partial", at: "2026-10-31T01:00:00Z" }],
  },
};

export const emptyEphemeris: Ephemeris = {
  ...sampleEphemeris,
  days: [],
  events: { ingresses: [], stations: [], moonPhases: [], eclipses: [] },
};
