import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CodedQueryError, errorCodeOf } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { deleteAccount, type AccountErrorCode } from "../accountService/accountService";

const ACCOUNT_ERROR_CODES: readonly AccountErrorCode[] = ["rate_limit_exceeded", "network_error", "delete_failed", "internal_error"];

export interface UseDeleteAccountResult {
  remove: () => Promise<boolean>;
  deleting: boolean;
  errorCode: AccountErrorCode | null;
  reset: () => void;
}

export function useDeleteAccount(signOut: () => Promise<unknown>): UseDeleteAccountResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await deleteAccount();
      if (error) throw new CodedQueryError(error);
    },
    onSuccess: async () => {
      await signOut();
      queryClient.clear();
    },
  });
  const { mutateAsync, reset } = mutation;

  const remove = async (): Promise<boolean> => {
    try {
      await mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    remove,
    deleting: mutation.isPending,
    errorCode: mutation.isError ? errorCodeOf(mutation.error, ACCOUNT_ERROR_CODES, "internal_error") : null,
    reset,
  };
}
