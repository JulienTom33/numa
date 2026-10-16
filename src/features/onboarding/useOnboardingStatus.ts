import { useCallback, useEffect, useState } from "react";
import { loadOnboardingDraft, ONBOARDING_STEP_COUNT } from "../../lib/onboardingStore";

export type OnboardingStatus = "loading" | "required" | "completed";

export interface UseOnboardingStatusResult {
  status: OnboardingStatus;
  markCompleted: () => void;
}

interface ResolvedStatus {
  userId: string;
  status: Exclude<OnboardingStatus, "loading">;
}

/**
 * Indique si l'utilisateur doit (re)passer par l'onboarding : terminé quand le brouillon a atteint
 * le récapitulatif et que ses données de naissance ont été finalisées. Une erreur de chargement
 * renvoie vers l'onboarding, qui affiche lui-même l'erreur.
 */
export function useOnboardingStatus(userId: string | null): UseOnboardingStatusResult {
  const [resolved, setResolved] = useState<ResolvedStatus | null>(null);

  useEffect(() => {
    if (userId === null) return;
    let cancelled = false;

    loadOnboardingDraft(userId).then(({ draft, birthDataId }) => {
      if (cancelled) return;
      const completed = draft?.step === ONBOARDING_STEP_COUNT && birthDataId !== null;
      setResolved({ userId, status: completed ? "completed" : "required" });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markCompleted = useCallback(() => {
    if (userId !== null) setResolved({ userId, status: "completed" });
  }, [userId]);

  let status: OnboardingStatus = "required";
  if (userId !== null) status = resolved?.userId === userId ? resolved.status : "loading";

  return { status, markCompleted };
}
