import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { HttpError } from "../_shared/http.ts";
import { createSupabaseChartSource, createSupabaseConversationStore } from "./store.ts";
import { chartFixture } from "./test_helpers.ts";

const answer = { text: "R", provider: "mistral", model: "m", promptVersion: "numa-chat-v1" };

function rpcClient(result: { data: unknown; error: { code: string } | null }, calls: unknown[]) {
  return {
    rpc: (name: string, args: unknown) => {
      calls.push([name, args]);
      return Promise.resolve(result);
    },
  } as unknown as SupabaseClient;
}

Deno.test("record_answer receives the traceability fields", async () => {
  const calls: unknown[] = [];
  const store = createSupabaseConversationStore(rpcClient({
    data: { conversation_id: "c-1", message_id: "m-1" },
    error: null,
  }, calls));

  const result = await store.record({
    userId: "u-1",
    conversationId: null,
    question: "Q",
    answer,
    factors: null,
  });

  assertEquals(result, { conversationId: "c-1", messageId: "m-1" });
  assertEquals(calls, [["record_answer", {
    p_user_id: "u-1",
    p_conversation_id: null,
    p_question: "Q",
    p_answer: "R",
    p_factors: {},
    p_prompt_version: "numa-chat-v1",
    p_provider: "mistral",
    p_model: "m",
  }]]);
});

Deno.test("an unknown conversation becomes a 404 and other errors stay opaque", async () => {
  const input = { userId: "u", conversationId: "c", question: "Q", answer, factors: null };

  const missing = await assertRejects(
    () =>
      createSupabaseConversationStore(rpcClient({ data: null, error: { code: "P0002" } }, []))
        .record(input),
    HttpError,
  );
  assertEquals([missing.status, missing.code], [404, "conversation_not_found"]);

  await assertRejects(
    () =>
      createSupabaseConversationStore(rpcClient({ data: null, error: { code: "XX000" } }, []))
        .record(input),
    Error,
    "rpc_record_answer_failed",
  );
});

function chartClient(result: { data: unknown; error: unknown }) {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => Promise.resolve(result),
  };
  return { from: () => query } as unknown as SupabaseClient;
}

Deno.test("the chart source returns the latest stored chart or null", async () => {
  const chart = chartFixture();

  assertEquals(
    await createSupabaseChartSource(chartClient({ data: { chart_data: chart }, error: null }))
      .latest("u"),
    chart,
  );
  assertEquals(
    await createSupabaseChartSource(chartClient({ data: null, error: null })).latest("u"),
    null,
  );
  await assertRejects(
    () => createSupabaseChartSource(chartClient({ data: null, error: {} })).latest("u"),
    Error,
    "chart_read_failed",
  );
});
