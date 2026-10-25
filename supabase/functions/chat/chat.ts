import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import { extractFactors } from "./factors.ts";
import type { QuestionProvider } from "./provider.ts";
import { containsPersonalData } from "./questionGuard.ts";
import { answerWithQuota, type QuotaStore, readQuota } from "./quota.ts";
import type { ChartSource, ConversationStore } from "./store.ts";

export const MAX_QUESTION_LENGTH = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ChatDependencies {
  store: QuotaStore;
  provider: QuestionProvider;
  charts: ChartSource;
  conversations: ConversationStore;
}

interface ChatInput {
  question: string;
  conversationId: string | null;
}

function field(body: unknown, name: string): unknown {
  if (typeof body !== "object" || body === null) return undefined;
  return (body as Record<string, unknown>)[name];
}

async function readInput(req: Request): Promise<ChatInput> {
  const body = await req.json().catch(() => null);
  const question = field(body, "question");
  const conversationId = field(body, "conversationId");

  if (typeof question !== "string" || question.trim() === "") {
    throw new HttpError(400, "invalid_question", "La question est vide.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new HttpError(400, "invalid_question", "La question est trop longue.");
  }
  if (containsPersonalData(question)) {
    throw new HttpError(400, "personal_data_detected", "personal_data_detected");
  }
  if (conversationId !== undefined && conversationId !== null) {
    if (typeof conversationId !== "string" || !UUID.test(conversationId)) {
      throw new HttpError(400, "invalid_conversation", "invalid_conversation");
    }
  }
  return { question: question.trim(), conversationId: conversationId ?? null };
}

export function createChatHandler({ store, provider, charts, conversations }: ChatDependencies) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    if (req.method === "GET") {
      return json({ quota: await readQuota(caller, store) });
    }
    const { question, conversationId } = await readInput(req);

    const { value, quota } = await answerWithQuota(caller, store, async () => {
      const chart = await charts.latest(caller.userId);
      const factors = chart ? extractFactors(chart) : null;
      const answer = await provider.answer({ question, factors });
      const recorded = await conversations.record({
        userId: caller.userId,
        conversationId,
        question,
        answer,
        factors,
      });
      return { answer: answer.text, ...recorded };
    });

    return json({
      answer: value.answer,
      conversationId: value.conversationId,
      messageId: value.messageId,
      quota,
    });
  };
}
