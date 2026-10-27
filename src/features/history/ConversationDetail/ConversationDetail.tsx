import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import ChatBubble from "../../../shared/components/ui/ChatBubble/ChatBubble";
import type { UseConversationMessagesResult } from "../useConversationMessages/useConversationMessages";

interface Props {
  result: UseConversationMessagesResult;
  onBack: () => void;
}

function ConversationDetail({ result, onBack }: Props) {
  const { t } = useTranslation("history");
  const { status, data, errorCode, retry } = result;

  const backButton = (
    <Button id="conversation-detail__button--back" variant="outline" onClick={onBack}>
      {t("detail.back")}
    </Button>
  );

  if (status === "loading") {
    return (
      <div id="conversation-detail__container--loading" className="flex w-full flex-col gap-3">
        <p id="conversation-detail__text--loading" role="status" className="text-sm text-ink-secondary">
          {t("detail.loading")}
        </p>
        {backButton}
      </div>
    );
  }
  if (status === "error" || data === null) {
    return (
      <div id="conversation-detail__container--error" className="flex w-full flex-col gap-3">
        <Callout id="conversation-detail__callout--error" tone="error">
          {t(`errors.${errorCode ?? "internal_error"}`)}
        </Callout>
        {errorCode !== "conversation_not_found" && (
          <Button id="conversation-detail__button--retry" variant="outline" onClick={retry}>
            {t("retry")}
          </Button>
        )}
        {backButton}
      </div>
    );
  }

  return (
    <div id="conversation-detail__container--main" className="flex w-full flex-col gap-4">
      {backButton}
      <h1 id="conversation-detail__title--main" className="font-display text-title font-bold text-ink">
        {data.conversation.title ?? t("untitled")}
      </h1>
      {data.messages.length === 0 ? (
        <p id="conversation-detail__text--empty" className="text-sm text-ink-secondary">
          {t("detail.empty")}
        </p>
      ) : (
        <div id="conversation-detail__log--messages" role="log" aria-label={t("detail.messages")} className="flex flex-col gap-3">
          {data.messages.map((message) => (
            <ChatBubble key={message.id} id={`conversation-detail__message--${message.id}`} author={message.author}>
              {message.text}
            </ChatBubble>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConversationDetail;
