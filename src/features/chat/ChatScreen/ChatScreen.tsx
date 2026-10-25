import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { questionQuotaErrorMessage } from "../../../i18n/messages/questionQuota/questionQuota";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import ChatView from "../ChatView/ChatView";
import { useChat } from "../useChat/useChat";

function ChatScreen() {
  const { t } = useTranslation("common");
  const { messages, sending, errorCode, quota, exhausted, send } = useChat();
  const { data } = useMyChart();
  const [draft, setDraft] = useState("");

  const handleSend = useCallback(
    async (question: string) => {
      setDraft("");
      const sent = await send(question);
      if (!sent) setDraft(question);
    },
    [send],
  );

  return (
    <ChatView
      messages={messages}
      sending={sending}
      errorMessage={errorCode ? questionQuotaErrorMessage(errorCode, t) : null}
      summary={data?.summary ?? null}
      quota={quota}
      exhausted={exhausted}
      draft={draft}
      onDraftChange={setDraft}
      onSend={(question) => {
        void handleSend(question);
      }}
    />
  );
}

export default ChatScreen;
