import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { canonicalCacheInput, computeCacheKey } from "./cacheKey.ts";
import { ENGINE_VERSION, SCHEMA_VERSION } from "../../../shared/contracts/natalChart/natalChart.ts";
import type { BirthInput } from "../../../shared/contracts/natalChart/natalChart.ts";

const BIRTH: BirthInput = {
  birthDate: "1975-06-15",
  birthTime: "14:30:00",
  timePrecision: "exact",
  timeMargin: null,
  timezone: "Europe/Paris",
  latitude: 48.8566,
  longitude: 2.3522,
};

const VERSIONS = {
  engineName: "astronomy-engine",
  engineVersion: ENGINE_VERSION,
  schemaVersion: SCHEMA_VERSION,
};

Deno.test("cle : SHA-256 hexadecimal stable pour une meme entree", async () => {
  const key = await computeCacheKey(BIRTH);
  assertEquals(key.length, 64);
  assertEquals(/^[0-9a-f]{64}$/.test(key), true);
  assertEquals(await computeCacheKey({ ...BIRTH }), key);
});

Deno.test("cle : chaque champ de naissance la fait changer", async () => {
  const base = await computeCacheKey(BIRTH);
  const variants: BirthInput[] = [
    { ...BIRTH, birthDate: "1975-06-16" },
    { ...BIRTH, birthTime: "14:31:00" },
    { ...BIRTH, timePrecision: "approximate", timeMargin: "under_30_min" },
    { ...BIRTH, timezone: "Europe/London" },
    { ...BIRTH, latitude: 48.9 },
    { ...BIRTH, longitude: 2.4 },
  ];
  for (const variant of variants) assertNotEquals(await computeCacheKey(variant), base);
});

Deno.test("cle : version du moteur et du schema integrees", async () => {
  const base = await computeCacheKey(BIRTH, VERSIONS);
  assertNotEquals(await computeCacheKey(BIRTH, { ...VERSIONS, engineVersion: "9.9.9" }), base);
  assertNotEquals(await computeCacheKey(BIRTH, { ...VERSIONS, schemaVersion: 2 }), base);
  assertNotEquals(await computeCacheKey(BIRTH, { ...VERSIONS, engineName: "autre" }), base);
});

Deno.test("cle : heure et marge ignorees quand elles n''influencent pas le calcul", async () => {
  const unknown = { ...BIRTH, timePrecision: "unknown" as const };
  assertEquals(
    await computeCacheKey({ ...unknown, birthTime: "08:00:00" }),
    await computeCacheKey({ ...unknown, birthTime: null }),
  );
  assertEquals(
    await computeCacheKey({ ...BIRTH, timeMargin: "over_2_h" }),
    await computeCacheKey(BIRTH),
  );
});

Deno.test("cle : entree canonique sans donnee superflue, systeme de maisons inclus", () => {
  const parsed = JSON.parse(canonicalCacheInput(BIRTH));
  assertEquals(parsed.houseSystem, "placidus");
  assertEquals(parsed.birthTime, "14:30");
});
