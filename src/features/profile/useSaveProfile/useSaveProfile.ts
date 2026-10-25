import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CodedQueryError } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import type { ProfileData, ProfileErrorCode, ProfileUpdate } from "../profileData/profileData";
import { profileErrorCode, profileQueryKeys } from "../profileQueries/profileQueries";
import { applyUpdate, saveProfile } from "../profileService/profileService";

export interface UseSaveProfileResult {
  save: (update: ProfileUpdate) => Promise<boolean>;
  saving: boolean;
  errorCode: ProfileErrorCode | null;
  reset: () => void;
}

export function useSaveProfile(profile: ProfileData): UseSaveProfileResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      const { error } = await saveProfile(profile, update);
      if (error) throw new CodedQueryError(error);
      return update;
    },
    onSuccess: async (update) => {
      queryClient.setQueryData(profileQueryKeys.mine(profile.userId), applyUpdate(profile, update));
      if (update.birth !== null) await queryClient.invalidateQueries({ queryKey: queryKeys.chart.all });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: profileQueryKeys.mine(profile.userId) }),
  });
  const { mutateAsync, reset } = mutation;

  const save = async (update: ProfileUpdate): Promise<boolean> => {
    try {
      await mutateAsync(update);
      return true;
    } catch {
      return false;
    }
  };

  return {
    save,
    saving: mutation.isPending,
    errorCode: mutation.isError ? profileErrorCode(mutation.error) : null,
    reset,
  };
}
