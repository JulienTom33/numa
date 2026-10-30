import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";
import { HttpError } from "../_shared/http.ts";
import type { ChatFactors } from "./factors.ts";
import { isRecord } from "./guards.ts";
import { HISTORY_MESSAGE_LIMIT, type HistoryMessage } from "./prompt.ts";
import type { GeneratedAnswer } from "./provider.ts";

export interface ChartSource {
  latest(userId: string): Promise<NatalChart | null>;
}

export interface RecordedAnswer {
  conversationId: string;
  messageId: string;
}

export interface ConversationStore {
  record(input: {
    userId: string;
    conversationId: string | null;
    question: string;
    answer: GeneratedAnswer;
    factors: ChatFactors | null;
  }): Promise<RecordedAnswer>;
  owns(userId: string, conversationId: string): Promise<boolean>;
  history(userId: string, conversationId: string): Promise<HistoryMessage[]>;
}

interface ChartRow {
  chart_data: NatalChart;
}

interface HistoryRow {
  role: "user" | "assistant";
  content: string;
}

interface RecordRow {
  conversation_id: string;
  message_id: string;
}

const CONVERSATION_NOT_FOUND = "P0002";

function isHistoryRow(value: unknown): value is HistoryRow {
  return isRecord(value) && (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string";
}

function isRecordRow(value: unknown): value is RecordRow {
  return isRecord(value) && typeof value.conversation_id === "string" &&
    typeof value.message_id === "string";
}

export function createSupabaseChartSource(client: SupabaseClient): ChartSource {
  return {
    async latest(userId) {
      const { data, error } = await client
        .from("natal_charts")
        .select("chart_data")
        .eq("user_id", userId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle<ChartRow>();
      if (error) throw new Error("chart_read_failed");
      return data ? data.chart_data : null;
    },
  };
}

export function createSupabaseConversationStore(client: SupabaseClient): ConversationStore {
  return {
    async record({ userId, conversationId, question, answer, factors }) {
      const { data, error } = await client.rpc("record_answer", {
        p_user_id: userId,
        p_conversation_id: conversationId,
        p_question: question,
        p_answer: answer.text,
        p_factors: factors ?? {},
        p_prompt_version: answer.promptVersion,
        p_provider: answer.provider,
        p_model: answer.model,
      });
      if (error?.code === CONVERSATION_NOT_FOUND) {
        throw new HttpError(404, "conversation_not_found", "conversation_not_found");
      }
      if (error) throw new Error("rpc_record_answer_failed");
      if (!isRecordRow(data)) throw new Error("rpc_record_answer_invalid");
      return { conversationId: data.conversation_id, messageId: data.message_id };
    },
    async owns(userId, conversationId) {
      const { data, error } = await client
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error("conversation_read_failed");
      return data !== null;
    },
    async history(userId, conversationId) {
      const { data, error } = await client
        .from("messages")
        .select("role, content, conversations!inner(user_id)")
        .eq("conversation_id", conversationId)
        .eq("conversations.user_id", userId)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: false })
        .order("role", { ascending: true })
        .limit(HISTORY_MESSAGE_LIMIT);
      if (error || !Array.isArray(data)) throw new Error("history_read_failed");
      return data.filter(isHistoryRow)
        .map(({ role, content }) => ({ role, content }))
        .reverse();
    },
  };
}
