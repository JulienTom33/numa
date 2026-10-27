import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { deleteAccount } from "../accountService/accountService";
import { useDeleteAccount } from "./useDeleteAccount";

vi.mock("../accountService/accountService", () => ({ deleteAccount: vi.fn() }));

beforeEach(() => {
  vi.mocked(deleteAccount).mockReset();
});

describe("useDeleteAccount", () => {
  it("termine la session et vide le cache après suppression", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue(null);
    const client = createTestQueryClient();
    client.setQueryData(["profile"], { a: 1 });
    const { result } = renderHook(() => useDeleteAccount(signOut), { wrapper: createQueryWrapper(client) });

    let ok = false;
    await act(async () => {
      ok = await result.current.remove();
    });

    expect(ok).toBe(true);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["profile"])).toBeUndefined();
  });

  it("expose l'erreur sans terminer la session", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ error: "rate_limit_exceeded" });
    const signOut = vi.fn();
    const { result } = renderHook(() => useDeleteAccount(signOut), { wrapper: createQueryWrapper() });

    let ok = true;
    await act(async () => {
      ok = await result.current.remove();
    });

    expect(ok).toBe(false);
    await waitFor(() => expect(result.current.errorCode).toBe("rate_limit_exceeded"));
    expect(signOut).not.toHaveBeenCalled();

    act(() => result.current.reset());
    await waitFor(() => expect(result.current.errorCode).toBeNull());
  });
});
