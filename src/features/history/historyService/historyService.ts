import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import {
  toHistoryAuthor,
  type ConversationDetailData,
  type ConversationSummary,
  type HistoryErrorCode,
  type HistoryMessage,
} from "../historyData/historyData";

export interface ConversationsResult {
  data: ConversationSummary[] | null;
  error: HistoryErrorCode | null;
}

export interface ConversationDetailResult {
  data: ConversationDetailData | null;
  error: HistoryErrorCode | null;
}

interface ConversationRow {
  id: string;
  title: string | null;
  updated_at: string;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

function toSummary(row: ConversationRow): ConversationSummary {
  return { id: row.id, title: row.title, updatedAt: row.updated_at };
}

export function toHistoryMessages(rows: MessageRow[]): HistoryMessage[] {
  return rows.flatMap((row) => {
    const author = toHistoryAuthor(row.role);
    return author === null ? [] : [{ id: row.id, author, text: row.content, createdAt: row.created_at }];
  });
}

export async function fetchConversations(userId: string): Promise<ConversationsResult> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return { data: null, error: "network_error" };
  return { data: data.map(toSummary), error: null };
}

export async function fetchConversationDetail(userId: string, conversationId: string): Promise<ConversationDetailResult> {
  const conversation = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (conversation.error) return { data: null, error: "network_error" };
  if (!conversation.data) return { data: null, error: "conversation_not_found" };

  const messages = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (messages.error) return { data: null, error: "network_error" };
  return {
    data: { conversation: toSummary(conversation.data), messages: toHistoryMessages(messages.data) },
    error: null,
  };
}

export interface DeleteConversationResult {
  error: HistoryErrorCode | null;
}

export async function deleteConversation(userId: string, conversationId: string): Promise<DeleteConversationResult> {
  const { error } = await supabase.from("conversations").delete().eq("id", conversationId).eq("user_id", userId);
  return { error: error ? "delete_failed" : null };
}
