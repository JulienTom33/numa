import type { ChatFactors } from "./factors.ts";

export interface QuestionRequest {
  question: string;
  factors: ChatFactors | null;
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
