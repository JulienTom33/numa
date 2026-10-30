import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ChatBubble from "../../../shared/components/ui/ChatBubble/ChatBubble";
import ChatAnswerBasis from "../ChatAnswerBasis/ChatAnswerBasis";
import type { ChatMessage } from "../useChat/useChat";

interface Props {
  messages: ChatMessage[];
  sending: boolean;
}

function ChatMessageList({ messages, sending }: Props) {
  const { t } = useTranslation("chat");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, sending]);

  return (
    <div
      id="chat-message-list__log--main"
      role="log"
      aria-live="polite"
      aria-label={t("messages.label")}
      className="flex flex-col gap-3"
    >
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          id={`chat-message-list__message--${message.id}`}
          author={message.author}
          why={message.basis === undefined ? undefined : <ChatAnswerBasis messageId={message.id} basis={message.basis} />}
        >
          {message.text}
        </ChatBubble>
      ))}
      {sending && <ChatBubble id="chat-message-list__message--pending" author="sidera" pending />}
      <div ref={endRef} />
    </div>
  );
}

export default ChatMessageList;
