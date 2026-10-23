import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { askQuestion, fetchQuestionQuota, type QuestionQuotaError } from "../questionQuota/questionQuota";
import { useQuestionQuota } from "./useQuestionQuota";

vi.mock("../questionQuota/questionQuota", () => ({
  askQuestion: vi.fn(),
  fetchQuestionQuota: vi.fn(),
}));

const EXCEEDED: QuestionQuotaError = { code: "question_quota_exceeded" };

describe("useQuestionQuota", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the counter from the server on mount", async () => {
    vi.mocked(fetchQuestionQuota).mockResolvedValue({
      quota: { limit: 2, used: 1, remaining: 1 },
      error: null,
    });

    const { result } = renderHook(() => useQuestionQuota());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quota).toEqual({ limit: 2, used: 1, remaining: 1 });
    expect(result.current.error).toBeNull();
  });

  it("updates the counter with the value returned by the server after an answer", async () => {
    vi.mocked(fetchQuestionQuota).mockResolvedValue({
      quota: { limit: 2, used: 1, remaining: 1 },
      error: null,
    });
    vi.mocked(askQuestion).mockResolvedValue({
      answer: "Réponse",
      quota: { limit: 2, used: 2, remaining: 0 },
      error: null,
    });
    const { result } = renderHook(() => useQuestionQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let answer: string | null = null;
    await act(async () => {
      answer = (await result.current.ask("Question")).answer;
    });

    expect(answer).toBe("Réponse");
    expect(result.current.quota).toEqual({ limit: 2, used: 2, remaining: 0 });
  });

  it("reloads the server counter when the quota is exceeded", async () => {
    vi.mocked(fetchQuestionQuota)
      .mockResolvedValueOnce({ quota: { limit: 2, used: 1, remaining: 1 }, error: null })
      .mockResolvedValueOnce({ quota: { limit: 2, used: 2, remaining: 0 }, error: null });
    vi.mocked(askQuestion).mockResolvedValue({ answer: null, quota: null, error: EXCEEDED });
    const { result } = renderHook(() => useQuestionQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.ask("Question");
    });

    expect(result.current.error).toEqual({
      code: "question_quota_exceeded",
      message: "Vous avez utilisé vos questions gratuites. Créez un compte pour continuer.",
    });
    expect(result.current.quota).toEqual({ limit: 2, used: 2, remaining: 0 });
  });

  it("keeps the counter unchanged when the provider fails", async () => {
    vi.mocked(fetchQuestionQuota).mockResolvedValue({
      quota: { limit: 2, used: 1, remaining: 1 },
      error: null,
    });
    const providerError: QuestionQuotaError = { code: "provider_unavailable" };
    vi.mocked(askQuestion).mockResolvedValue({ answer: null, quota: null, error: providerError });
    const { result } = renderHook(() => useQuestionQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.ask("Question");
    });

    expect(result.current.error).toEqual({
      code: "provider_unavailable",
      message: "La réponse n'a pas pu être générée. Votre question n'a pas été décomptée.",
    });
    expect(result.current.quota).toEqual({ limit: 2, used: 1, remaining: 1 });
    expect(fetchQuestionQuota).toHaveBeenCalledTimes(1);
  });

  it("exposes a loading error from the server", async () => {
    const networkError: QuestionQuotaError = { code: "network_error" };
    vi.mocked(fetchQuestionQuota).mockResolvedValue({ quota: null, error: networkError });

    const { result } = renderHook(() => useQuestionQuota());

    await waitFor(() =>
      expect(result.current.error).toEqual({ code: "network_error", message: "Le service est momentanément indisponible." }),
    );
  });
});
