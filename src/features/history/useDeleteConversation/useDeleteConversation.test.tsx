import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { historyQueryKeys } from "../historyQueries/historyQueries";
import { deleteConversation } from "../historyService/historyService";
import { useDeleteConversation } from "./useDeleteConversation";

vi.mock("../historyService/historyService", () => ({ deleteConversation: vi.fn() }));

beforeEach(() => {
  vi.mocked(deleteConversation).mockReset();
});

describe("useDeleteConversation", () => {
  it("supprime puis invalide la liste", async () => {
    vi.mocked(deleteConversation).mockResolvedValue({ error: null });
    const client = createTestQueryClient();
    client.setQueryData(historyQueryKeys.conversations("u1"), []);
    const { result } = renderHook(() => useDeleteConversation("u1"), { wrapper: createQueryWrapper(client) });

    let ok = false;
    await act(async () => {
      ok = await result.current.remove("c1");
    });

    expect(ok).toBe(true);
    expect(deleteConversation).toHaveBeenCalledWith("u1", "c1");
    expect(client.getQueryState(historyQueryKeys.conversations("u1"))?.isInvalidated).toBe(true);
  });

  it("expose l'erreur puis la réinitialise", async () => {
    vi.mocked(deleteConversation).mockResolvedValue({ error: "delete_failed" });
    const { result } = renderHook(() => useDeleteConversation("u1"), { wrapper: createQueryWrapper() });

    let ok = true;
    await act(async () => {
      ok = await result.current.remove("c1");
    });

    expect(ok).toBe(false);
    await waitFor(() => expect(result.current.errorCode).toBe("delete_failed"));
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.errorCode).toBeNull());
  });
});
