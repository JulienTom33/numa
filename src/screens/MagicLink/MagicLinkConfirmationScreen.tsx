import { useState } from "react";
import Button from "../../components/ui/Button/Button";
import Callout from "../../components/ui/Callout/Callout";
import Icon from "../../components/ui/Icon/Icon";
import TopBar from "../../components/ui/TopBar/TopBar";
import { useCooldown } from "../../hooks/useCooldown";

// Aligné sur la limite par défaut de Supabase Auth (un email OTP par adresse toutes les 60 s).
export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

const RESEND_ERROR_MESSAGE = "Le renvoi du lien a échoué. Vérifiez votre connexion puis réessayez.";

type ResendStatus = "idle" | "sending" | "sent" | "failed";

interface Props {
  email: string;
  onOpenSpace: () => void;
  onResend: (email: string) => Promise<void> | void;
  onBack?: () => void;
  resendCooldownSeconds?: number;
  // Le premier lien vient d'être envoyé : par défaut, le renvoi attend le même délai qu'après un renvoi.
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
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const {
    remainingSeconds,
    isCoolingDown,
    start: startCooldown,
  } = useCooldown(initialCooldownSeconds);

  const resendLabel = isCoolingDown
    ? `Renvoyer le lien (${remainingSeconds} s)`
    : "Renvoyer le lien";

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
        backLabel="Modifier l'adresse email"
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
            Vérifiez votre boîte mail
          </h1>
          <p id="magic-link-confirmation__text--email" className="text-sm text-ink-secondary">
            Nous avons envoyé un lien de connexion à{" "}
            <strong
              id="magic-link-confirmation__text--address"
              className="break-all font-semibold text-ink"
            >
              {email}
            </strong>
            . Ouvrez-le depuis cet appareil pour accéder à votre espace.
          </p>
        </div>

        <div id="magic-link-confirmation__status--resend" role="status" aria-live="polite">
          {resendStatus === "sent" && (
            <Callout id="magic-link-confirmation__callout--resent" tone="success">
              Un nouveau lien vient d'être envoyé à {email}.
            </Callout>
          )}
        </div>
        {resendStatus === "failed" && (
          <Callout id="magic-link-confirmation__callout--error" tone="error">
            {RESEND_ERROR_MESSAGE}
          </Callout>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <Button id="magic-link-confirmation__button--open-space" fullWidth onClick={onOpenSpace}>
            Accéder à mon espace
          </Button>
          <Button
            id="magic-link-confirmation__button--resend"
            variant="outline"
            fullWidth
            onClick={handleResend}
            disabled={isCoolingDown}
            loading={resendStatus === "sending"}
            loadingLabel="Renvoi en cours…"
          >
            {resendLabel}
          </Button>
        </div>
      </section>
    </main>
  );
}

export default MagicLinkConfirmationScreen;
