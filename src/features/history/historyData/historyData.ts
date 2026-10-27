export type HistoryErrorCode = "network_error" | "conversation_not_found" | "delete_failed" | "internal_error";

export type HistoryAuthor = "user" | "sidera";

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface HistoryMessage {
  id: string;
  author: HistoryAuthor;
  text: string;
  createdAt: string;
}

export interface ConversationDetailData {
  conversation: ConversationSummary;
  messages: HistoryMessage[];
}

export function toHistoryAuthor(role: string): HistoryAuthor | null {
  if (role === "user") return "user";
  if (role === "assistant") return "sidera";
  return null;
}
