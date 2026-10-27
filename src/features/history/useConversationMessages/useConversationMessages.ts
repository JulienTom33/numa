import { useQuery } from "@tanstack/react-query";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import type { ConversationDetailData, HistoryErrorCode } from "../historyData/historyData";
import { conversationQueryOptions, historyErrorCode } from "../historyQueries/historyQueries";

export interface UseConversationMessagesResult {
  status: LoadStatus;
  data: ConversationDetailData | null;
  errorCode: HistoryErrorCode | null;
  retry: () => void;
}

export function useConversationMessages(userId: string, conversationId: string): UseConversationMessagesResult {
  const query = useQuery(conversationQueryOptions(userId, conversationId));
  const { refetch } = query;

  return {
    status: loadStatus(query),
    data: query.data ?? null,
    errorCode: query.isError ? historyErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
