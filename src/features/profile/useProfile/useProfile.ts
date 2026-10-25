import { useQuery } from "@tanstack/react-query";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import type { ProfileData, ProfileErrorCode } from "../profileData/profileData";
import { profileErrorCode, profileQueryOptions } from "../profileQueries/profileQueries";

export interface UseProfileResult {
  status: LoadStatus;
  data: ProfileData | null;
  errorCode: ProfileErrorCode | null;
  retry: () => void;
}

export function useProfile(userId: string): UseProfileResult {
  const query = useQuery(profileQueryOptions(userId));
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? profileErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
