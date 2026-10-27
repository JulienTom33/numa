import { useQuery } from "@tanstack/react-query";
import { loadStatus, type LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import type { ConversationSummary, HistoryErrorCode } from "../historyData/historyData";
import { conversationsQueryOptions, historyErrorCode } from "../historyQueries/historyQueries";

export interface UseConversationsResult {
  status: LoadStatus;
  conversations: ConversationSummary[];
  errorCode: HistoryErrorCode | null;
  retry: () => void;
}

export function useConversations(userId: string): UseConversationsResult {
  const query = useQuery(conversationsQueryOptions(userId));
  const { refetch } = query;

  return {
    status: loadStatus(query),
    conversations: query.data ?? [],
    errorCode: query.isError ? historyErrorCode(query.error) : null,
    retry: () => {
      void refetch();
    },
  };
}
