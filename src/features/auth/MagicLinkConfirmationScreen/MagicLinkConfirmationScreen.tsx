import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Icon from "../../../shared/components/ui/Icon/Icon";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";
import { useCooldown } from "../../../shared/useCooldown/useCooldown";

export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

type ResendStatus = "idle" | "sending" | "sent" | "failed";

interface Props {
  email: string;
  onOpenSpace: () => void;
  onResend: (email: string) => Promise<void> | void;
  onBack?: () => void;
  resendCooldownSeconds?: number;
  initialCooldownSeconds?: number;
}

function MagicLinkConfirmationScreen({
  email,
  onOpenSpace,
  onResend,
  onBack,
  resendCooldownSeconds = DEFAULT_RESEND_COOLDOWN_SECONDS,
  initialCooldownSeconds = resendCooldownSeconds,
}: Props) {
  const { t } = useTranslation("auth");
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const {
    remainingSeconds,
    isCoolingDown,
    start: startCooldown,
  } = useCooldown(initialCooldownSeconds);

  const resendLabel = isCoolingDown
    ? t("magicLink.confirmation.resendCountdown", { count: remainingSeconds })
    : t("magicLink.confirmation.resend");

  async function handleResend() {
    setResendStatus("sending");
    try {
      await onResend(email);
      setResendStatus("sent");
      startCooldown(resendCooldownSeconds);
    } catch {
      setResendStatus("failed");
    }
  }

  return (
    <main
      id="magic-link-confirmation__main--root"
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-4 pb-8 text-ink"
    >
      <TopBar
        id="magic-link-confirmation__topbar--main"
        onBack={onBack}
        backLabel={t("magicLink.confirmation.editEmail")}
      />
      <section
        id="magic-link-confirmation__section--main"
        aria-labelledby="magic-link-confirmation__title--main"
        className="flex flex-1 flex-col gap-6 pt-4"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-soft text-violet-ink">
            <Icon name="send" size={28} />
          </span>
          <h1
            id="magic-link-confirmation__title--main"
            className="font-display text-title font-bold"
          >
            {t("magicLink.confirmation.title")}
          </h1>
          <p id="magic-link-confirmation__text--email" className="text-sm text-ink-secondary">
            <Trans
              t={t}
              i18nKey="magicLink.confirmation.sentTo"
              values={{ email }}
              components={{
                address: (
                  <strong
                    id="magic-link-confirmation__text--address"
                    className="break-all font-semibold text-ink"
                  />
                ),
              }}
            />
          </p>
        </div>

        <div id="magic-link-confirmation__status--resend" role="status" aria-live="polite">
          {resendStatus === "sent" && (
            <Callout id="magic-link-confirmation__callout--resent" tone="success">
              {t("magicLink.confirmation.resent", { email })}
            </Callout>
          )}
        </div>
        {resendStatus === "failed" && (
          <Callout id="magic-link-confirmation__callout--error" tone="error">
            {t("magicLink.confirmation.resendError")}
          </Callout>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <Button id="magic-link-confirmation__button--open-space" fullWidth onClick={onOpenSpace}>
            {t("magicLink.confirmation.openSpace")}
          </Button>
          <Button
            id="magic-link-confirmation__button--resend"
            variant="outline"
            fullWidth
            onClick={handleResend}
            disabled={isCoolingDown}
            loading={resendStatus === "sending"}
            loadingLabel={t("magicLink.confirmation.resending")}
          >
            {resendLabel}
          </Button>
        </div>
      </section>
    </main>
  );
}

export default MagicLinkConfirmationScreen;
