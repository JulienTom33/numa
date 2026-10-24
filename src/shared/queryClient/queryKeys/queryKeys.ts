const chartRoot = ["chart"] as const;
const onboardingRoot = ["onboarding"] as const;
const discoveryRoot = ["discovery"] as const;

export const queryKeys = {
  chart: {
    all: chartRoot,
    mine: () => [...chartRoot, "mine"] as const,
    ascendant: (refreshKey: string | null) => [...chartRoot, "ascendant", refreshKey] as const,
  },
  onboarding: {
    all: onboardingRoot,
    draft: (userId: string) => [...onboardingRoot, "draft", userId] as const,
    status: (userId: string) => [...onboardingRoot, "status", userId] as const,
  },
  discovery: {
    all: discoveryRoot,
    questionQuota: () => [...discoveryRoot, "question-quota"] as const,
  },
};
