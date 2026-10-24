import { useTranslation } from "react-i18next";
import Chip from "../../../shared/components/ui/Chip/Chip";

const SUGGESTION_KEYS = ["week", "love", "work", "energy", "sun"] as const;

interface Props {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

function ChatSuggestions({ onSelect, disabled = false }: Props) {
  const { t } = useTranslation("chat");

  return (
    <ul
      id="chat-suggestions__list--main"
      aria-label={t("suggestions.label")}
      className="flex flex-wrap justify-center gap-2"
    >
      {SUGGESTION_KEYS.map((key) => {
        const question = t(`suggestions.items.${key}`);
        return (
          <li key={key}>
            <Chip id={`chat-suggestions__chip--${key}`} disabled={disabled} onClick={() => onSelect(question)}>
              {question}
            </Chip>
          </li>
        );
      })}
    </ul>
  );
}

export default ChatSuggestions;
