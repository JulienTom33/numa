import { assertEquals } from "jsr:@std/assert@1";
import { chartFixture } from "../chat/test_helpers.ts";
import { basisOf, buildFactors, MAX_TRANSIT_ASPECTS } from "./context.ts";

const INSTANT = new Date("2026-10-27T10:00:00Z");

Deno.test("buildFactors keeps the natal factors and a bounded list of transits", () => {
  const factors = buildFactors(chartFixture(), "2026-10-27", INSTANT);

  assertEquals(factors.date, "2026-10-27");
  assertEquals(factors.natal.bodies[0].body, "sun");
  assertEquals(factors.transits.aspects.length <= MAX_TRANSIT_ASPECTS, true);
  assertEquals(factors.transits.bodies.some((body) => body.body === "moon"), true);
  assertEquals(
    factors.transits.bodies.every((body) =>
      body.body === "sun" || body.body === "moon" || body.retrograde
    ),
    true,
  );
});

Deno.test("buildFactors carries no personal data", () => {
  const serialized = JSON.stringify(buildFactors(chartFixture(), "2026-10-27", INSTANT));

  assertEquals(serialized.includes("1975-06-15"), false);
  assertEquals(serialized.includes("Europe/Paris"), false);
});

Deno.test("basisOf exposes the transits and warnings that were used", () => {
  const factors = buildFactors(chartFixture(false), "2026-10-27", INSTANT);
  const basis = basisOf(factors);

  assertEquals(basis.aspects, factors.transits.aspects);
  assertEquals(basis.warnings, ["unknown_time"]);
  assertEquals(basis.confidence, "low");
});

Deno.test("basisOf tolerates malformed stored factors", () => {
  assertEquals(basisOf(null), { confidence: null, aspects: [], warnings: [] });
  assertEquals(
    basisOf({ transits: { aspects: [{ transitBody: "sun" }, 3] }, natal: { warnings: [1, "x"] } }),
    { confidence: null, aspects: [], warnings: ["x"] },
  );
});
