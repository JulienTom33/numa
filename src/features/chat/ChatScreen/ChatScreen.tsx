import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { questionQuotaErrorMessage } from "../../../i18n/messages/questionQuota/questionQuota";
import { useNavigate } from "react-router";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { paths } from "../../../shared/navigation/routes/routes";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import ChatView from "../ChatView/ChatView";
import SignupPrompt from "../SignupPrompt/SignupPrompt";
import { useChat } from "../useChat/useChat";

const SIGNUP_PROMPT_ANSWERS = 2;

function ChatScreen() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { isAnonymous } = useAppContext();
  const [promptDismissed, setPromptDismissed] = useState(false);
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

  const answerCount = messages.filter((message) => message.author === "sidera").length;
  const promptOpen = isAnonymous && !promptDismissed && !sending && answerCount >= SIGNUP_PROMPT_ANSWERS;

  return (
    <>
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
      <SignupPrompt
        open={promptOpen}
        onSignUp={() => navigate(paths.signup)}
        onSignIn={() => navigate(paths.signin)}
        onContinue={() => setPromptDismissed(true)}
      />
    </>
  );
}

export default ChatScreen;
