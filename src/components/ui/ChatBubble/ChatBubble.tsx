import type { ReactNode } from "react";
import { cx } from "../../../lib/cx";
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

const authorLabels: Record<ChatAuthor, string> = {
  user: "Vous",
  numa: "Numa",
};

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
  pendingLabel = "Numa écrit…",
}: Props) {
  return (
    <article
      id={id}
      aria-label={authorLabels[author]}
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
          {pendingLabel}
        </p>
      ) : (
        <div>{children}</div>
      )}
      {!pending && period && (
        <p className="text-xs text-ink-secondary">
          <span className="font-semibold">Période concernée :</span> {period}
        </p>
      )}
      {!pending && why && (
        <Disclosure id={`${id}-why`} summary="Pourquoi cette réponse ?">
          {why}
        </Disclosure>
      )}
    </article>
  );
}

export default ChatBubble;
