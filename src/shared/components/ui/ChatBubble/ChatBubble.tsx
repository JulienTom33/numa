import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../cx/cx";
import Disclosure from "../Disclosure/Disclosure";

export type ChatAuthor = "user" | "numa";

interface Props {
  id: string;
  author: ChatAuthor;
  children?: ReactNode;
  period?: string;
  why?: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
}

const bubbleClasses: Record<ChatAuthor, string> = {
  user: "ml-auto rounded-br-md bg-ink text-white",
  numa: "mr-auto rounded-bl-md border border-line bg-white text-ink",
};

const typingDotDelays = [
  "[animation-delay:0ms]",
  "[animation-delay:150ms]",
  "[animation-delay:300ms]",
];

function ChatBubble({
  id,
  author,
  children,
  period,
  why,
  pending = false,
  pendingLabel,
}: Props) {
  const { t } = useTranslation("ui");

  return (
    <article
      id={id}
      aria-label={t(`chat.author.${author}`)}
      aria-busy={pending || undefined}
      className={cx(
        "flex max-w-[85%] flex-col gap-2 rounded-card px-4 py-3 text-sm leading-relaxed",
        bubbleClasses[author],
      )}
    >
      {pending ? (
        <p className="flex items-center gap-2 text-ink-secondary">
          <span aria-hidden="true" className="flex gap-1">
            {typingDotDelays.map((delay) => (
              <span
                key={delay}
                className={cx(
                  "h-1.5 w-1.5 animate-pulse rounded-full bg-violet motion-reduce:animate-none",
                  delay,
                )}
              />
            ))}
          </span>
          {pendingLabel ?? t("chat.pending")}
        </p>
      ) : (
        <div>{children}</div>
      )}
      {!pending && period && (
        <p className="text-xs text-ink-secondary">
          <span className="font-semibold">{t("chat.period")}</span> {period}
        </p>
      )}
      {!pending && why && (
        <Disclosure id={`${id}-why`} summary={t("chat.why")}>
          {why}
        </Disclosure>
      )}
    </article>
  );
}

export default ChatBubble;
