import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import EmptyState from "../../../shared/components/ui/EmptyState/EmptyState";
import ListRow from "../../../shared/components/ui/ListRow/ListRow";
import type { ConversationSummary } from "../historyData/historyData";

interface Props {
  conversations: ConversationSummary[];
  onOpen: (conversationId: string) => void;
}

function ConversationList({ conversations, onOpen }: Props) {
  const { t, i18n } = useTranslation("history");

  if (conversations.length === 0) {
    return (
      <EmptyState
        id="conversation-list__empty--main"
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul
      id="conversation-list__list--main"
      aria-label={t("list.label")}
      className="divide-y divide-line rounded-card border border-line bg-white"
    >
      {conversations.map((conversation) => (
        <li key={conversation.id} id={`conversation-list__item--${conversation.id}`}>
          <ListRow
            id={`conversation-list__button--${conversation.id}`}
            label={conversation.title ?? t("untitled")}
            value={formatDate(new Date(conversation.updatedAt), i18n.language, { dateStyle: "medium" })}
            onClick={() => onOpen(conversation.id)}
          />
        </li>
      ))}
    </ul>
  );
}

export default ConversationList;
