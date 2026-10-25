import { useTranslation } from "react-i18next";
import Callout from "../../../shared/components/ui/Callout/Callout";
import ChatInput from "../../../shared/components/ui/ChatInput/ChatInput";
import type { NatalChartSummary } from "../../chart/natalChartSummary/natalChartSummary";
import type { QuestionQuota } from "../../discovery/questionQuota/questionQuota";
import ChatMessageList from "../ChatMessageList/ChatMessageList";
import ChatProfileBadge from "../ChatProfileBadge/ChatProfileBadge";
import ChatSuggestions from "../ChatSuggestions/ChatSuggestions";
import type { ChatMessage } from "../useChat/useChat";

interface Props {
  messages: ChatMessage[];
  sending: boolean;
  errorMessage: string | null;
  summary: NatalChartSummary | null;
  quota: QuestionQuota | null;
  exhausted: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (question: string) => void;
}

function ChatView({
  messages,
  sending,
  errorMessage,
  summary,
  quota,
  exhausted,
  draft,
  onDraftChange,
  onSend,
}: Props) {
  const { t } = useTranslation("chat");
  const empty = messages.length === 0 && !sending;

  return (
    <section id="chat-view__section--main" className="flex w-full max-w-2xl flex-col gap-4 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <ChatProfileBadge summary={summary} />
        {quota && (
          <p id="chat-view__text--quota" className="text-xs text-ink-secondary">
            {t("quota.remaining", { count: quota.remaining })}
          </p>
        )}
      </div>
      {empty && (
        <div id="chat-view__intro--empty" className="flex flex-col items-center gap-4 py-6 text-center">
          <h2 id="chat-view__title--intro" className="text-title-sm font-bold text-ink">
            {t("intro.title")}
          </h2>
          <p className="max-w-sm text-sm text-ink-secondary">{t("intro.description")}</p>
          <ChatSuggestions disabled={exhausted} onSelect={onSend} />
        </div>
      )}
      <ChatMessageList messages={messages} sending={sending} />
      {errorMessage && (
        <Callout id="chat-view__callout--error" tone="error" title={t("error.title")}>
          {errorMessage}
        </Callout>
      )}
      {exhausted && (
        <Callout id="chat-view__callout--exhausted" tone="highlight">
          {t("quota.exhausted")}
        </Callout>
      )}
      <ChatInput
        id="chat-view__input--question"
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSend}
        disabled={sending || exhausted}
        placeholder={exhausted ? t("input.disabledPlaceholder") : undefined}
      />
    </section>
  );
}

export default ChatView;
