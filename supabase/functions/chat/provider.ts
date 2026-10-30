import type { ChatFactors } from "./factors.ts";
import type { HistoryMessage } from "./prompt.ts";

export interface QuestionRequest {
  question: string;
  factors: ChatFactors | null;
  history?: HistoryMessage[];
}

export interface GeneratedAnswer {
  text: string;
  provider: string;
  model: string;
  promptVersion: string;
}

export interface QuestionProvider {
  answer(request: QuestionRequest): Promise<GeneratedAnswer>;
}
