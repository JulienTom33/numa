import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import type { QuestionProvider } from "./provider.ts";
import { answerWithQuota, type QuotaStore, readQuota } from "./quota.ts";

export const MAX_QUESTION_LENGTH = 2000;

export interface ChatDependencies {
  store: QuotaStore;
  provider: QuestionProvider;
}

function questionField(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return undefined;
  return (body as Record<string, unknown>).question;
}

async function readQuestion(req: Request): Promise<string> {
  const question = questionField(await req.json().catch(() => null));

  if (typeof question !== "string" || question.trim() === "") {
    throw new HttpError(400, "invalid_question", "La question est vide.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new HttpError(400, "invalid_question", "La question est trop longue.");
  }
  return question.trim();
}

/** GET : état du quota de l'appelant. POST `{ question }` : réponse et quota mis à jour. */
export function createChatHandler({ store, provider }: ChatDependencies) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    if (req.method === "GET") {
      return json({ quota: await readQuota(caller, store) });
    }
    const question = await readQuestion(req);
    return json(await answerWithQuota(caller, question, store, provider));
  };
}
