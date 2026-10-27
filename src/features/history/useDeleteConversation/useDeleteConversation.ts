import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CodedQueryError } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import type { HistoryErrorCode } from "../historyData/historyData";
import { historyErrorCode, historyQueryKeys } from "../historyQueries/historyQueries";
import { deleteConversation } from "../historyService/historyService";

export interface UseDeleteConversationResult {
  remove: (conversationId: string) => Promise<boolean>;
  deleting: boolean;
  errorCode: HistoryErrorCode | null;
  reset: () => void;
}

export function useDeleteConversation(userId: string): UseDeleteConversationResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await deleteConversation(userId, conversationId);
      if (error) throw new CodedQueryError(error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: historyQueryKeys.all });
    },
  });
  const { mutateAsync, reset } = mutation;

  const remove = async (conversationId: string): Promise<boolean> => {
    try {
      await mutateAsync(conversationId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    remove,
    deleting: mutation.isPending,
    errorCode: mutation.isError ? historyErrorCode(mutation.error) : null,
    reset,
  };
}
