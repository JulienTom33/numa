import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import { ASCENDANT_STEP, loadOnboardingDraft } from "../onboardingStore/onboardingStore";

export type OnboardingStatus = "loading" | "required" | "completed";

export interface UseOnboardingStatusResult {
  status: OnboardingStatus;
  markCompleted: () => void;
}

type ResolvedStatus = Exclude<OnboardingStatus, "loading">;

async function resolveStatus(userId: string): Promise<ResolvedStatus> {
  const { draft, birthDataId } = await loadOnboardingDraft(userId);
  return draft?.step === ASCENDANT_STEP && birthDataId !== null ? "completed" : "required";
}

export function useOnboardingStatus(userId: string | null): UseOnboardingStatusResult {
  const queryClient = useQueryClient();
  const key = queryKeys.onboarding.status(userId ?? "");
  const query = useQuery({
    queryKey: key,
    queryFn: () => (userId === null ? Promise.resolve<ResolvedStatus>("required") : resolveStatus(userId)),
    enabled: userId !== null,
    staleTime: Infinity,
  });

  const markCompleted = useCallback(() => {
    if (userId !== null) queryClient.setQueryData<ResolvedStatus>(queryKeys.onboarding.status(userId), "completed");
  }, [queryClient, userId]);

  let status: OnboardingStatus = "loading";
  if (userId === null || query.isError) status = "required";
  else if (query.data !== undefined) status = query.data;

  return { status, markCompleted };
}
