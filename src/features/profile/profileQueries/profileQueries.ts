import { queryOptions } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import type { ProfileErrorCode } from "../profileData/profileData";
import { fetchProfile } from "../profileService/profileService";

export const PROFILE_ERROR_CODES: readonly ProfileErrorCode[] = [
  "profile_not_found",
  "birth_data_not_found",
  "network_error",
  "save_failed",
  "internal_error",
];

const profileRoot = ["profile"] as const;

export const profileQueryKeys = {
  all: profileRoot,
  mine: (userId: string) => [...profileRoot, "mine", userId] as const,
};

export function profileErrorCode(error: unknown): ProfileErrorCode {
  return errorCodeOf(error, PROFILE_ERROR_CODES, "internal_error");
}

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: profileQueryKeys.mine(userId),
    queryFn: async () => {
      const result = await fetchProfile(userId);
      return unwrapResult(result.data, result.error);
    },
  });
}
