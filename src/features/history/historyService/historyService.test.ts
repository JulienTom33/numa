import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { deleteConversation, fetchConversationDetail, fetchConversations, toHistoryMessages } from "./historyService";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: { from: vi.fn() } }));

interface Result {
  data: unknown;
  error: unknown;
}

function mockTables(tables: Record<string, Result>) {
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    const result = tables[table];
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
    };
    return chain;
  }) as never);
}

const CONVERSATION = { id: "c1", title: "Ma question", updated_at: "2026-10-20T10:00:00Z" };

beforeEach(() => {
  vi.mocked(supabase.from).mockReset();
});

describe("toHistoryMessages", () => {
  it("convertit les rôles et ignore les messages système", () => {
    const result = toHistoryMessages([
      { id: "m1", role: "user", content: "Q", created_at: "2026-10-20T10:00:00Z" },
      { id: "m2", role: "system", content: "S", created_at: "2026-10-20T10:00:01Z" },
      { id: "m3", role: "assistant", content: "R", created_at: "2026-10-20T10:00:02Z" },
    ]);
    expect(result.map((message) => [message.id, message.author])).toEqual([
      ["m1", "user"],
      ["m3", "sidera"],
    ]);
  });
});

describe("fetchConversations", () => {
  it("retourne les conversations", async () => {
    mockTables({ conversations: { data: [CONVERSATION], error: null } });
    const result = await fetchConversations("u1");
    expect(result).toEqual({ data: [{ id: "c1", title: "Ma question", updatedAt: "2026-10-20T10:00:00Z" }], error: null });
  });

  it("signale une erreur réseau", async () => {
    mockTables({ conversations: { data: null, error: { message: "boom" } } });
    expect(await fetchConversations("u1")).toEqual({ data: null, error: "network_error" });
  });
});

describe("deleteConversation", () => {
  function mockDelete(result: Result) {
    const eq = vi.fn();
    const chain = { eq };
    eq.mockReturnValueOnce(chain).mockResolvedValueOnce(result);
    const del = vi.fn(() => chain);
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as never);
    return { eq };
  }

  it("supprime la conversation de l'utilisateur", async () => {
    const { eq } = mockDelete({ data: null, error: null });
    expect(await deleteConversation("u1", "c1")).toEqual({ error: null });
    expect(supabase.from).toHaveBeenCalledWith("conversations");
    expect(eq).toHaveBeenNthCalledWith(1, "id", "c1");
    expect(eq).toHaveBeenNthCalledWith(2, "user_id", "u1");
  });

  it("signale un échec de suppression", async () => {
    mockDelete({ data: null, error: { message: "boom" } });
    expect(await deleteConversation("u1", "c1")).toEqual({ error: "delete_failed" });
  });
});

describe("fetchConversationDetail", () => {
  it("retourne la conversation et ses messages", async () => {
    mockTables({
      conversations: { data: CONVERSATION, error: null },
      messages: { data: [{ id: "m1", role: "user", content: "Q", created_at: "2026-10-20T10:00:00Z" }], error: null },
    });
    const result = await fetchConversationDetail("u1", "c1");
    expect(result.error).toBeNull();
    expect(result.data?.messages).toHaveLength(1);
    expect(result.data?.conversation.id).toBe("c1");
  });

  it("signale une conversation introuvable ou d'un autre utilisateur", async () => {
    mockTables({ conversations: { data: null, error: null } });
    expect(await fetchConversationDetail("u1", "c9")).toEqual({ data: null, error: "conversation_not_found" });
  });

  it("signale une erreur réseau sur la conversation", async () => {
    mockTables({ conversations: { data: null, error: { message: "boom" } } });
    expect(await fetchConversationDetail("u1", "c1")).toEqual({ data: null, error: "network_error" });
  });

  it("signale une erreur réseau sur les messages", async () => {
    mockTables({ conversations: { data: CONVERSATION, error: null }, messages: { data: null, error: { message: "boom" } } });
    expect(await fetchConversationDetail("u1", "c1")).toEqual({ data: null, error: "network_error" });
  });
});
