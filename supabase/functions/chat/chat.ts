import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import {
  enforceAiDailyLimit,
  enforceRateLimit,
  RATE_LIMITS,
  type RateLimitStore,
} from "../_shared/rateLimit.ts";
import { extractFactors } from "./factors.ts";
import { isRecord } from "./guards.ts";
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
  rateLimits: RateLimitStore;
  dailyAiLimit: number;
}

interface ChatInput {
  question: string;
  conversationId: string | null;
}

function field(body: unknown, name: string): unknown {
  return isRecord(body) ? body[name] : undefined;
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

export function createChatHandler(
  { store, provider, charts, conversations, rateLimits, dailyAiLimit }: ChatDependencies,
) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    if (req.method === "GET") {
      return json({ quota: await readQuota(caller, store) });
    }
    await enforceRateLimit(rateLimits, RATE_LIMITS.chat, caller.userId);
    const { question, conversationId } = await readInput(req);
    if (conversationId !== null && !(await conversations.owns(caller.userId, conversationId))) {
      throw new HttpError(404, "conversation_not_found", "conversation_not_found");
    }

    const { value, quota } = await answerWithQuota(caller, store, async () => {
      await enforceAiDailyLimit(rateLimits, dailyAiLimit);
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
      return { answer: answer.text, basis: factors, ...recorded };
    });

    return json({
      answer: value.answer,
      basis: value.basis,
      conversationId: value.conversationId,
      messageId: value.messageId,
      quota,
    });
  };
}
