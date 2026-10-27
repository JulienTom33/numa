import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import ConversationDetail from "../ConversationDetail/ConversationDetail";
import ConversationList from "../ConversationList/ConversationList";
import DeleteConversationSheet from "../DeleteConversationSheet/DeleteConversationSheet";
import { useDeleteConversation } from "../useDeleteConversation/useDeleteConversation";
import { useConversationMessages } from "../useConversationMessages/useConversationMessages";
import { useConversations } from "../useConversations/useConversations";

interface Props {
  userId: string;
}

interface OpenProps extends Props {
  conversationId: string;
  onBack: () => void;
}

function OpenConversation({ userId, conversationId, onBack }: OpenProps) {
  const result = useConversationMessages(userId, conversationId);
  return <ConversationDetail result={result} onBack={onBack} />;
}

function HistoryFlowContent({ userId }: Props) {
  const { t } = useTranslation("history");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { status, conversations, errorCode, retry } = useConversations(userId);
  const { remove, deleting, errorCode: deleteErrorCode, reset } = useDeleteConversation(userId);
  const pending = conversations.find((conversation) => conversation.id === pendingDeleteId) ?? null;

  const closeDeletion = () => {
    reset();
    setPendingDeleteId(null);
  };

  const confirmDeletion = () => {
    if (pendingDeleteId === null) return;
    void remove(pendingDeleteId).then((ok) => {
      if (ok) setPendingDeleteId(null);
    });
  };

  if (openId !== null) {
    return <OpenConversation userId={userId} conversationId={openId} onBack={() => setOpenId(null)} />;
  }
  if (status === "loading") {
    return (
      <p id="history__text--loading" role="status" className="text-sm text-ink-secondary">
        {t("loading")}
      </p>
    );
  }
  if (status === "error") {
    return (
      <div id="history__container--error" className="flex w-full flex-col gap-3">
        <Callout id="history__callout--load-error" tone="error">
          {t(`errors.${errorCode ?? "internal_error"}`)}
        </Callout>
        <Button id="history__button--retry" variant="outline" onClick={retry}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  return (
    <div id="history__container--main" className="flex w-full flex-col gap-4">
      <h1 id="history__title--main" className="font-display text-title font-bold text-ink">
        {t("title")}
      </h1>
      <ConversationList
        conversations={conversations}
        onOpen={setOpenId}
        onDelete={(conversationId) => {
          reset();
          setPendingDeleteId(conversationId);
        }}
      />
      <DeleteConversationSheet
        open={pending !== null}
        title={pending?.title ?? t("untitled")}
        deleting={deleting}
        errorCode={deleteErrorCode}
        onConfirm={confirmDeletion}
        onCancel={closeDeletion}
      />
    </div>
  );
}

function HistoryFlow() {
  const { session } = useAppContext();
  if (!session) return null;
  return <HistoryFlowContent userId={session.user.id} />;
}

export default HistoryFlow;
