import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createQueryWrapper, createTestQueryClient } from "./queryTestWrapper";

describe("queryTestWrapper", () => {
  it("fournit un client sans nouvelle tentative", async () => {
    let calls = 0;
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["x"],
          queryFn: () => {
            calls += 1;
            return Promise.reject(new Error("boom"));
          },
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(1);
  });

  it("partage le client fourni", () => {
    const client = createTestQueryClient();
    client.setQueryData(["k"], 1);
    const { result } = renderHook(() => useQuery({ queryKey: ["k"], queryFn: () => 2 }), {
      wrapper: createQueryWrapper(client),
    });
    expect(result.current.data).toBe(1);
  });
});
