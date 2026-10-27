import { useCallback, useRef, useState } from "react";
import type { ChatAuthor } from "../../../shared/components/ui/ChatBubble/ChatBubble";
import type { QuestionQuota, QuestionQuotaErrorCode } from "../../discovery/questionQuota/questionQuota";
import { useQuestionQuota } from "../../discovery/useQuestionQuota/useQuestionQuota";

export interface ChatMessage {
  id: string;
  author: ChatAuthor;
  text: string;
}

export interface UseChatResult {
  messages: ChatMessage[];
  sending: boolean;
  errorCode: QuestionQuotaErrorCode | null;
  quota: QuestionQuota | null;
  exhausted: boolean;
  send: (question: string) => Promise<boolean>;
}

export function useChat(): UseChatResult {
  const { quota, ask } = useQuestionQuota();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<QuestionQuotaErrorCode | null>(null);
  const sendingRef = useRef(false);
  const counterRef = useRef(0);

  const nextId = useCallback(() => {
    counterRef.current += 1;
    return `m${counterRef.current}`;
  }, []);

  const send = useCallback(
    async (question: string) => {
      if (sendingRef.current) return false;
      sendingRef.current = true;
      setSending(true);
      setErrorCode(null);
      const userMessage: ChatMessage = { id: nextId(), author: "user", text: question };
      setMessages((current) => [...current, userMessage]);

      const result = await ask(question);

      sendingRef.current = false;
      setSending(false);
      if (result.error || result.answer === null) {
        setMessages((current) => current.filter((message) => message.id !== userMessage.id));
        setErrorCode(result.error?.code ?? "unknown_error");
        return false;
      }
      const answer = result.answer;
      setMessages((current) => [...current, { id: nextId(), author: "sidera", text: answer }]);
      return true;
    },
    [ask, nextId],
  );

  const exhausted = quota !== null && quota.remaining === 0;

  return { messages, sending, errorCode, quota, exhausted, send };
}
