import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_ONBOARDING_DATA } from "../../lib/birthData";
import { loadOnboardingDraft } from "../../lib/onboardingStore";
import { useOnboardingStatus } from "./useOnboardingStatus";

vi.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../lib/onboardingStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/onboardingStore")>()),
  loadOnboardingDraft: vi.fn(),
}));

describe("useOnboardingStatus", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("is required without loading anything when there is no session", () => {
    const { result } = renderHook(() => useOnboardingStatus(null));

    expect(result.current.status).toBe("required");
    expect(loadOnboardingDraft).not.toHaveBeenCalled();
  });

  it("requires onboarding when no draft exists", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });

    const { result } = renderHook(() => useOnboardingStatus("user-1"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("required"));
    expect(loadOnboardingDraft).toHaveBeenCalledWith("user-1");
  });

  it("requires onboarding for a draft still in progress", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 3, data: EMPTY_ONBOARDING_DATA },
      birthDataId: null,
      error: null,
    });

    const { result } = renderHook(() => useOnboardingStatus("user-1"));

    await waitFor(() => expect(result.current.status).toBe("required"));
  });

  it("is completed once the summary is reached with finalised birth data", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 5, data: EMPTY_ONBOARDING_DATA },
      birthDataId: "bd-1",
      error: null,
    });

    const { result } = renderHook(() => useOnboardingStatus("user-1"));

    await waitFor(() => expect(result.current.status).toBe("completed"));
  });

  it("requires onboarding when the draft cannot be loaded", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: "load_failed" });

    const { result } = renderHook(() => useOnboardingStatus("user-1"));

    await waitFor(() => expect(result.current.status).toBe("required"));
  });

  it("switches to completed when the flow ends", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });
    const { result } = renderHook(() => useOnboardingStatus("user-1"));
    await waitFor(() => expect(result.current.status).toBe("required"));

    act(() => result.current.markCompleted());

    expect(result.current.status).toBe("completed");
  });

  it("reloads the status when the user changes", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });
    const { result, rerender } = renderHook(({ userId }) => useOnboardingStatus(userId), {
      initialProps: { userId: "user-1" as string | null },
    });
    await waitFor(() => expect(result.current.status).toBe("required"));

    rerender({ userId: "user-2" });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("required"));
    expect(loadOnboardingDraft).toHaveBeenLastCalledWith("user-2");
  });
});
