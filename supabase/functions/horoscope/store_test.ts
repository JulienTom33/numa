import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { chartFixture } from "../chat/test_helpers.ts";
import { buildFactors } from "./context.ts";
import { createSupabaseChartSource, createSupabaseHoroscopeStore } from "./store.ts";
import { stubHoroscopeProvider } from "./stub.ts";

const SECTIONS = { general: "a", relations: "b", work: "c", energy: "d" };
const ROW = {
  horoscope_date: "2026-10-27",
  sections: SECTIONS,
  factors: { transits: { aspects: [] } },
  prompt_version: "sidera-horoscope-v1",
};

function client(read: { data: unknown; error: unknown }, upserts: unknown[] = []) {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => Promise.resolve(read),
    upsert: (row: unknown, options: unknown) => {
      upserts.push([row, options]);
      return Promise.resolve({ error: null });
    },
  };
  return { from: () => query } as unknown as SupabaseClient;
}

Deno.test("the chart source returns the id and data of the latest chart", async () => {
  const chart = chartFixture();

  assertEquals(
    await createSupabaseChartSource(client({ data: { id: "c-1", chart_data: chart }, error: null }))
      .latest("u"),
    { id: "c-1", chart },
  );
  assertEquals(
    await createSupabaseChartSource(client({ data: null, error: null })).latest("u"),
    null,
  );
  await assertRejects(
    () => createSupabaseChartSource(client({ data: null, error: {} })).latest("u"),
    Error,
    "chart_read_failed",
  );
});

Deno.test("find returns the stored reading, null when absent or unreadable", async () => {
  assertEquals(
    await createSupabaseHoroscopeStore(client({ data: ROW, error: null })).find("u", "d"),
    {
      date: "2026-10-27",
      sections: SECTIONS,
      factors: ROW.factors,
      promptVersion: "sidera-horoscope-v1",
    },
  );
  assertEquals(
    await createSupabaseHoroscopeStore(client({ data: null, error: null })).find("u", "d"),
    null,
  );
  assertEquals(
    await createSupabaseHoroscopeStore(client({ data: { ...ROW, sections: null }, error: null }))
      .find("u", "d"),
    null,
  );
  await assertRejects(
    () => createSupabaseHoroscopeStore(client({ data: null, error: {} })).find("u", "d"),
    Error,
    "horoscope_read_failed",
  );
});

Deno.test("save writes the traceability columns without overwriting an existing reading", async () => {
  const upserts: unknown[] = [];
  const factors = buildFactors(chartFixture(), "2026-10-27", new Date("2026-10-27T10:00:00Z"));
  const generated = await stubHoroscopeProvider.generate(factors);

  const saved = await createSupabaseHoroscopeStore(client({ data: ROW, error: null }, upserts))
    .save({
      userId: "u-1",
      chartId: "c-1",
      date: "2026-10-27",
      factors,
      generated,
    });

  assertEquals(saved.date, "2026-10-27");
  assertEquals(upserts, [[{
    user_id: "u-1",
    natal_chart_id: "c-1",
    horoscope_date: "2026-10-27",
    content: Object.values(generated.sections).join("\n\n"),
    sections: generated.sections,
    factors,
    prompt_version: "sidera-horoscope-v1",
    provider: "stub",
    model: "stub",
  }, { onConflict: "user_id,horoscope_date", ignoreDuplicates: true }]]);
});
