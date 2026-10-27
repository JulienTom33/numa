import { queryOptions } from "@tanstack/react-query";
import { errorCodeOf, unwrapResult } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import type { HistoryErrorCode } from "../historyData/historyData";
import { fetchConversationDetail, fetchConversations } from "../historyService/historyService";

export const HISTORY_ERROR_CODES: readonly HistoryErrorCode[] = ["network_error", "conversation_not_found", "internal_error"];

const historyRoot = ["history"] as const;

export const historyQueryKeys = {
  all: historyRoot,
  conversations: (userId: string) => [...historyRoot, "conversations", userId] as const,
  conversation: (userId: string, conversationId: string) => [...historyRoot, "conversation", userId, conversationId] as const,
};

export function historyErrorCode(error: unknown): HistoryErrorCode {
  return errorCodeOf(error, HISTORY_ERROR_CODES, "internal_error");
}

export function conversationsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: historyQueryKeys.conversations(userId),
    queryFn: async () => {
      const result = await fetchConversations(userId);
      return unwrapResult(result.data, result.error);
    },
  });
}

export function conversationQueryOptions(userId: string, conversationId: string) {
  return queryOptions({
    queryKey: historyQueryKeys.conversation(userId, conversationId),
    queryFn: async () => {
      const result = await fetchConversationDetail(userId, conversationId);
      return unwrapResult(result.data, result.error);
    },
  });
}
