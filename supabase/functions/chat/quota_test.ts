import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { Caller } from "../_shared/auth.ts";
import { HttpError } from "../_shared/http.ts";
import type { QuestionProvider } from "./provider.ts";
import {
  ANONYMOUS_QUESTION_LIMIT,
  answerWithQuota,
  createSupabaseQuotaStore,
  readQuota,
} from "./quota.ts";
import { createMemoryStore, echoProvider, failingProvider } from "./test_helpers.ts";

const anonymous: Caller = { userId: "anon-1", isAnonymous: true };
const member: Caller = { userId: "member-1", isAnonymous: false };

Deno.test("the anonymous quota allows two questions", () => {
  assertEquals(ANONYMOUS_QUESTION_LIMIT, 2);
});

Deno.test("returns the second answer, then refuses the third question", async () => {
  const store = createMemoryStore();
  const provider = echoProvider();

  const first = await answerWithQuota(
    anonymous,
    store,
    () => provider.answer({ question: "q1", factors: null }),
  );
  assertEquals(first.quota, { limit: 2, used: 1, remaining: 1 });

  const second = await answerWithQuota(
    anonymous,
    store,
    () => provider.answer({ question: "q2", factors: null }),
  );
  assertEquals(second.value.text, "réponse à : q2");
  assertEquals(second.quota, { limit: 2, used: 2, remaining: 0 });

  const error = await assertRejects(
    () =>
      answerWithQuota(anonymous, store, () => provider.answer({ question: "q3", factors: null })),
    HttpError,
  );
  assertEquals([error.status, error.code], [429, "question_quota_exceeded"]);
  assertEquals(provider.calls, ["q1", "q2"]);
});

Deno.test("a provider error does not consume a question", async () => {
  const store = createMemoryStore();

  const error = await assertRejects(
    () =>
      answerWithQuota(
        anonymous,
        store,
        () => failingProvider.answer({ question: "q1", factors: null }),
      ),
    HttpError,
  );

  assertEquals([error.status, error.code], [502, "provider_unavailable"]);
  assertEquals(await store.used(anonymous.userId), 0);
  assertEquals(store.pending(), 0);
});

Deno.test("two simultaneous questions cannot exceed the quota", async () => {
  const store = createMemoryStore();
  await answerWithQuota(
    anonymous,
    store,
    () => echoProvider().answer({ question: "q1", factors: null }),
  );

  let release = () => {};
  const slowProvider: QuestionProvider = {
    answer: () =>
      new Promise((resolve) =>
        release = () => resolve({ text: "lente", provider: "test", model: "m", promptVersion: "v" })
      ),
  };

  const pending = answerWithQuota(
    anonymous,
    store,
    () => slowProvider.answer({ question: "q2", factors: null }),
  );
  const concurrent = await assertRejects(
    () =>
      answerWithQuota(
        anonymous,
        store,
        () => echoProvider().answer({ question: "q2-bis", factors: null }),
      ),
    HttpError,
  );
  assertEquals(concurrent.status, 429);

  release();
  assertEquals((await pending).quota?.used, 2);
});

Deno.test("identified accounts are not limited by the anonymous quota", async () => {
  const store = createMemoryStore();
  const provider = echoProvider();

  for (const question of ["q1", "q2", "q3"]) {
    const result = await answerWithQuota(
      member,
      store,
      () => provider.answer({ question, factors: null }),
    );
    assertEquals(result.quota, null);
  }
  assertEquals(await readQuota(member, store), null);
});

Deno.test("readQuota reports the server-side counter", async () => {
  const store = createMemoryStore();
  assertEquals(await readQuota(anonymous, store), { limit: 2, used: 0, remaining: 2 });

  await answerWithQuota(
    anonymous,
    store,
    () => echoProvider().answer({ question: "q1", factors: null }),
  );
  assertEquals(await readQuota(anonymous, store), { limit: 2, used: 1, remaining: 1 });
});

function fakeClient(results: Record<string, unknown>, calls: [string, unknown][]) {
  return {
    rpc: (name: string, args: unknown) => {
      calls.push([name, args]);
      return Promise.resolve(
        name in results
          ? { data: results[name], error: null }
          : { data: null, error: { message: "boom" } },
      );
    },
  } as unknown as SupabaseClient;
}

Deno.test("the Supabase store maps each operation to its SQL function", async () => {
  const calls: [string, unknown][] = [];
  const store = createSupabaseQuotaStore(fakeClient({
    reserve_question: "r-1",
    commit_question: 1,
    release_question: null,
    question_count: 1,
  }, calls));

  assertEquals(await store.reserve("u-1", 2), "r-1");
  assertEquals(await store.commit("r-1"), 1);
  await store.release("r-2");
  assertEquals(await store.used("u-1"), 1);
  assertEquals(calls, [
    ["reserve_question", { p_user_id: "u-1", p_limit: 2 }],
    ["commit_question", { p_reservation_id: "r-1" }],
    ["release_question", { p_reservation_id: "r-2" }],
    ["question_count", { p_user_id: "u-1" }],
  ]);
});

Deno.test("the Supabase store surfaces RPC errors without their detail", async () => {
  const store = createSupabaseQuotaStore(fakeClient({}, []));

  await assertRejects(() => store.reserve("u-1", 2), Error, "rpc_reserve_question_failed");
});
