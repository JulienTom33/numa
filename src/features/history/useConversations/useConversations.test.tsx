import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchConversations } from "../historyService/historyService";
import { useConversations } from "./useConversations";

vi.mock("../historyService/historyService", () => ({ fetchConversations: vi.fn(), fetchConversationDetail: vi.fn() }));

beforeEach(() => {
  vi.mocked(fetchConversations).mockReset();
});

describe("useConversations", () => {
  it("charge les conversations", async () => {
    vi.mocked(fetchConversations).mockResolvedValue({
      data: [{ id: "c1", title: "A", updatedAt: "2026-10-20T10:00:00Z" }],
      error: null,
    });
    const { result } = renderHook(() => useConversations("u1"), { wrapper: createQueryWrapper() });
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.conversations).toHaveLength(1);
  });

  it("expose le code d'erreur et permet de réessayer", async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce({ data: null, error: "network_error" });
    const { result } = renderHook(() => useConversations("u1"), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("network_error");

    vi.mocked(fetchConversations).mockResolvedValueOnce({ data: [], error: null });
    result.current.retry();
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});
