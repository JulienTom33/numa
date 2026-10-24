import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import type { UseAuthResult } from "../../../features/auth/useAuth/useAuth";
import type { UseOnboardingStatusResult } from "../../../features/onboarding/useOnboardingStatus/useOnboardingStatus";

export interface AppContextValue {
  auth: UseAuthResult;
  session: Session | null;
  isAnonymous: boolean;
  onboarding: UseOnboardingStatusResult;
  discover: () => Promise<void>;
  discoverFailed: boolean;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext must be used inside AppRoot");
  return value;
}
