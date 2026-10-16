import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BirthPlace, OnboardingData } from "../lib/birthData";
import { completeOnboarding, loadOnboardingDraft, saveOnboardingDraft } from "../lib/onboardingStore";
import { useOnboarding } from "./useOnboarding";

vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../lib/onboardingStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/onboardingStore")>()),
  loadOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  completeOnboarding: vi.fn(),
}));

const USER_ID = "user-1";
const TODAY = new Date(2026, 9, 15, 12, 0);
const LYON: BirthPlace = { label: "Lyon, France", latitude: 45.764043, longitude: 4.835659, timezone: "Europe/Paris" };

const COMPLETE_DATA: OnboardingData = {
  firstName: "Émile",
  birthDate: "1990-03-12",
  birthTime: { precision: "unknown", time: "", margin: null },
  birthPlace: LYON,
};

async function renderLoaded(userId: string | null = USER_ID) {
  const hook = renderHook(() => useOnboarding({ userId, today: TODAY }));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });
    vi.mocked(saveOnboardingDraft).mockResolvedValue({ error: null });
    vi.mocked(completeOnboarding).mockResolvedValue({ birthDataId: "bd-1", error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts at step 1 with empty data and Continue disabled", async () => {
    const { result } = await renderLoaded();

    expect(loadOnboardingDraft).toHaveBeenCalledWith(USER_ID);
    expect(result.current.step).toBe(1);
    expect(result.current.stepCount).toBe(5);
    expect(result.current.data.firstName).toBe("");
    expect(result.current.canContinue).toBe(false);
    expect(result.current.errors.firstName).toBe("Indiquez un prénom ou un pseudonyme.");
  });

  it("resumes a saved draft after a reload", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 3, data: { ...COMPLETE_DATA, birthPlace: null } },
      birthDataId: null,
      error: null,
    });

    const { result } = await renderLoaded();

    expect(result.current.step).toBe(3);
    expect(result.current.data.firstName).toBe("Émile");
    expect(result.current.birthDateParts).toEqual({ day: 12, month: 3, year: 1990 });
    expect(result.current.isStepValid(3)).toBe(true);
    expect(result.current.isStepValid(4)).toBe(false);
  });

  it("surfaces a load error and lets the user start over", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: "load_failed" });

    const { result } = await renderLoaded();

    expect(result.current.error).toBe("Votre saisie précédente n'a pas pu être récupérée. Vous pouvez reprendre depuis le début.");
    expect(result.current.errorCode).toBe("load_failed");
    expect(result.current.step).toBe(1);
  });

  it("does not load anything without a session", async () => {
    const { result } = await renderLoaded(null);

    expect(loadOnboardingDraft).not.toHaveBeenCalled();
    act(() => result.current.setFirstName("Émile"));

    let advanced = true;
    await act(async () => {
      advanced = await result.current.next();
    });

    expect(advanced).toBe(false);
    expect(result.current.error).toBe("Votre session a expiré. Rechargez la page pour reprendre votre saisie.");
    expect(result.current.errorCode).toBe("missing_session");
    expect(saveOnboardingDraft).not.toHaveBeenCalled();
  });

  it("refuses to continue while the current step is invalid", async () => {
    const { result } = await renderLoaded();

    let advanced = true;
    await act(async () => {
      advanced = await result.current.next();
    });

    expect(advanced).toBe(false);
    expect(saveOnboardingDraft).not.toHaveBeenCalled();
  });

  it("walks through the five steps, saving each one and completing after step 4", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setFirstName("Émile"));
    expect(result.current.canContinue).toBe(true);
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.step).toBe(2);
    expect(saveOnboardingDraft).toHaveBeenLastCalledWith(USER_ID, {
      step: 2,
      ascendant: { source: null, declaredSign: null },
      data: expect.objectContaining({ firstName: "Émile" }),
    });

    act(() => result.current.setBirthDateParts({ day: 31, month: 2, year: 1990 }));
    expect(result.current.errors.birthDate).toBe("Cette date n'existe pas. Vérifiez le jour et le mois.");
    expect(result.current.data.birthDate).toBeNull();
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.setBirthDateParts({ day: 12, month: 3, year: 1990 }));
    expect(result.current.data.birthDate).toBe("1990-03-12");
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.step).toBe(3);

    act(() => result.current.setBirthTime({ precision: "unknown", time: "", margin: null }));
    expect(result.current.canContinue).toBe(true);
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.step).toBe(4);
    expect(completeOnboarding).not.toHaveBeenCalled();

    act(() => result.current.setBirthPlace(LYON));
    await act(async () => {
      await result.current.next();
    });

    expect(result.current.step).toBe(5);
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
    expect(result.current.birthDataId).toBe("bd-1");
    expect(result.current.summary.birthTime).toBe("Heure inconnue");
    expect(result.current.hasPreciseBirthData).toBe(false);
    expect(result.current.canContinue).toBe(true);

    let finished = false;
    await act(async () => {
      finished = await result.current.next();
    });
    expect(finished).toBe(true);
    expect(result.current.step).toBe(6);
    expect(saveOnboardingDraft).toHaveBeenCalledTimes(5);
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it("stays on the step and reports the error when saving fails", async () => {
    vi.mocked(saveOnboardingDraft).mockResolvedValue({ error: "save_failed" });
    const { result } = await renderLoaded();

    act(() => result.current.setFirstName("Émile"));
    let advanced = true;
    await act(async () => {
      advanced = await result.current.next();
    });

    expect(advanced).toBe(false);
    expect(result.current.step).toBe(1);
    expect(result.current.error).toBe("Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.");
    expect(result.current.saving).toBe(false);
  });

  it("stays on step 4 when the completion fails", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: { step: 4, data: COMPLETE_DATA }, birthDataId: null, error: null });
    vi.mocked(completeOnboarding).mockResolvedValue({ birthDataId: null, error: "save_failed" });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.step).toBe(4);
    expect(result.current.error).toBe("Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.");
  });

  it("moves from the summary to the ascendant step without finalising again", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: { step: 5, data: COMPLETE_DATA }, birthDataId: "bd-1", error: null });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.next();
    });

    expect(saveOnboardingDraft).toHaveBeenCalledWith(USER_ID, {
      step: 6,
      data: COMPLETE_DATA,
      ascendant: { source: null, declaredSign: null },
    });
    expect(completeOnboarding).not.toHaveBeenCalled();
    expect(result.current.step).toBe(6);
  });

  it("blocks the ascendant step until the choice is complete, then finalises with it", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: { step: 6, data: COMPLETE_DATA }, birthDataId: "bd-1", error: null });
    const { result } = await renderLoaded();
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.setAscendant({ source: "declared", declaredSign: null }));
    expect(result.current.canContinue).toBe(false);

    act(() => result.current.setAscendant({ source: "declared", declaredSign: "leo" }));
    expect(result.current.canContinue).toBe(true);

    let finished = false;
    await act(async () => {
      finished = await result.current.next();
    });

    expect(finished).toBe(true);
    expect(saveOnboardingDraft).toHaveBeenCalledWith(USER_ID, {
      step: 6,
      data: COMPLETE_DATA,
      ascendant: { source: "declared", declaredSign: "leo" },
    });
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it("restores the saved ascendant choice when resuming", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 6, data: COMPLETE_DATA, ascendant: { source: "computed", declaredSign: null } },
      birthDataId: "bd-1",
      error: null,
    });
    const { result } = await renderLoaded();

    expect(result.current.ascendant).toEqual({ source: "computed", declaredSign: null });
    expect(result.current.canContinue).toBe(true);
  });

  it("goes back and only jumps to steps whose previous steps are filled", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 5, data: COMPLETE_DATA },
      birthDataId: "bd-1",
      error: null,
    });
    const { result } = await renderLoaded();
    expect(result.current.birthDataId).toBe("bd-1");

    act(() => result.current.goToStep(2));
    expect(result.current.step).toBe(2);

    act(() => result.current.back());
    act(() => result.current.back());
    expect(result.current.step).toBe(1);

    act(() => result.current.setFirstName(""));
    act(() => result.current.goToStep(3));
    expect(result.current.step).toBe(1);
  });
});
