import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestionQuota } from "../../discovery/useQuestionQuota/useQuestionQuota";
import { useChat } from "./useChat";

vi.mock("../../discovery/useQuestionQuota/useQuestionQuota", () => ({ useQuestionQuota: vi.fn() }));

const ask = vi.fn();

function mockQuota(remaining: number) {
  vi.mocked(useQuestionQuota).mockReturnValue({
    quota: { limit: 4, used: 4 - remaining, remaining },
    loading: false,
    error: null,
    refresh: vi.fn(),
    ask,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQuota(2);
});

describe("useChat", () => {
  it("ajoute la question puis la réponse", async () => {
    ask.mockResolvedValue({ answer: "Réponse", basis: null, quota: null, error: null });
    const { result } = renderHook(() => useChat());

    let sent = false;
    await act(async () => {
      sent = await result.current.send("Question");
    });

    expect(sent).toBe(true);
    expect(result.current.messages.map((message) => [message.author, message.text])).toEqual([
      ["user", "Question"],
      ["sidera", "Réponse"],
    ]);
  });

  it("rattache le fondement à la réponse et laisse la question sans fondement", async () => {
    const basis = {
      confidence: "high" as const,
      houseSystem: "placidus",
      bodies: [],
      ascendant: null,
      midheaven: null,
      aspects: [],
      warnings: [],
    };
    ask.mockResolvedValue({ answer: "Réponse", basis, quota: null, error: null });
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Question");
    });

    expect(result.current.messages.map((message) => message.basis)).toEqual([undefined, basis]);
  });

  it("retire la question et expose le code en cas d'erreur", async () => {
    ask.mockResolvedValue({ answer: null, basis: null, quota: null, error: { code: "provider_unavailable" } });
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Question");
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.errorCode).toBe("provider_unavailable");
    expect(result.current.sending).toBe(false);
  });

  it("signale le quota épuisé", () => {
    mockQuota(0);
    const { result } = renderHook(() => useChat());
    expect(result.current.exhausted).toBe(true);
  });
});
