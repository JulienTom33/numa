import { FunctionsHttpError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { askQuestion, fetchQuestionQuota } from "./questionQuota";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const QUOTA = { limit: 2, used: 1, remaining: 1 };

function httpError(status: number, body: unknown): FunctionsHttpError {
  return new FunctionsHttpError(new Response(JSON.stringify(body), { status }));
}

describe("fetchQuestionQuota", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads the counter from the chat function", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { quota: QUOTA }, error: null } as never);

    const result = await fetchQuestionQuota();

    expect(result).toEqual({ quota: QUOTA, error: null });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("chat", { method: "GET" });
  });

  it("returns a generic error when the function is unreachable", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: new Error("offline") } as never);

    const result = await fetchQuestionQuota();

    expect(result.quota).toBeNull();
    expect(result.error?.code).toBe("network_error");
  });
});

describe("askQuestion", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the answer and the updated server counter", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { answer: "Réponse", quota: { limit: 2, used: 2, remaining: 0 } },
      error: null,
    } as never);

    const result = await askQuestion("Ma question");

    expect(result).toEqual({
      answer: "Réponse",
      quota: { limit: 2, used: 2, remaining: 0 },
      error: null,
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("chat", { body: { question: "Ma question" } });
  });

  it("exposes the quota-exceeded code sent by the server", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: httpError(429, { error: { code: "question_quota_exceeded", message: "Quota atteint." } }),
    } as never);

    const result = await askQuestion("Troisième question");

    expect(result).toEqual({
      answer: null,
      quota: null,
      error: { code: "question_quota_exceeded" },
    });
  });

  it.each([
    ["invalid_token", "unauthenticated"],
    ["invalid_question", "invalid_question"],
    ["ai_unavailable", "ai_unavailable"],
    ["personal_data_detected", "personal_data_detected"],
    ["rate_limit_exceeded", "rate_limit_exceeded"],
    ["ai_daily_limit_exceeded", "ai_daily_limit_exceeded"],
    ["internal_error", "unknown_error"],
  ])("maps the %s server code to %s", async (serverCode, expected) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: httpError(400, { error: { code: serverCode, message: "…" } }),
    } as never);

    const result = await askQuestion("Question");

    expect(result.error).toEqual({ code: expected });
  });

  it("falls back to a generic error when the error body is not readable", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: httpError(500, { unexpected: true }),
    } as never);

    const result = await askQuestion("Question");

    expect(result.error?.code).toBe("network_error");
  });
});
