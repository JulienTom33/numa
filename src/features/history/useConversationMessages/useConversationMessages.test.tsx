import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchConversationDetail } from "../historyService/historyService";
import { useConversationMessages } from "./useConversationMessages";

vi.mock("../historyService/historyService", () => ({ fetchConversations: vi.fn(), fetchConversationDetail: vi.fn() }));

beforeEach(() => {
  vi.mocked(fetchConversationDetail).mockReset();
});

describe("useConversationMessages", () => {
  it("charge la conversation et ses messages", async () => {
    vi.mocked(fetchConversationDetail).mockResolvedValue({
      data: { conversation: { id: "c1", title: "A", updatedAt: "2026-10-20T10:00:00Z" }, messages: [] },
      error: null,
    });
    const { result } = renderHook(() => useConversationMessages("u1", "c1"), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.conversation.id).toBe("c1");
    expect(fetchConversationDetail).toHaveBeenCalledWith("u1", "c1");
  });

  it("expose conversation_not_found", async () => {
    vi.mocked(fetchConversationDetail).mockResolvedValue({ data: null, error: "conversation_not_found" });
    const { result } = renderHook(() => useConversationMessages("u1", "c9"), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("conversation_not_found");
  });
});
