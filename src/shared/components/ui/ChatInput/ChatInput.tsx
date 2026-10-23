import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../cx/cx";
import Icon from "../Icon/Icon";
import { focusRing } from "../styles/styles";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  label?: string;
  placeholder?: string;
  sendLabel?: string;
  disabled?: boolean;
}

function ChatInput({
  id,
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  sendLabel,
  disabled = false,
}: Props) {
  const { t } = useTranslation(["ui", "common"]);
  const message = value.trim();
  const canSend = !disabled && message.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) onSubmit(message);
  };

  return (
    <form
      id={`${id}-form`}
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-1.5 focus-within:border-violet focus-within:ring-2 focus-within:ring-violet/30"
    >
      <label htmlFor={id} className="sr-only">
        {label ?? t("chat.inputLabel")}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder ?? t("chat.inputPlaceholder")}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-hidden disabled:cursor-not-allowed"
      />
      <button
        id={`${id}-send`}
        type="submit"
        aria-label={sendLabel ?? t("common:actions.send")}
        disabled={!canSend}
        className={cx(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white transition-colors hover:bg-coral-hover",
          focusRing,
          "disabled:cursor-not-allowed disabled:bg-coral-disabled",
        )}
      >
        <Icon name="send" size={18} />
      </button>
    </form>
  );
}

export default ChatInput;
