import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button/Button";
import Callout from "../../components/ui/Callout/Callout";
import TextField from "../../components/ui/TextField/TextField";
import TopBar from "../../components/ui/TopBar/TopBar";
import { isValidEmail, normalizeEmail } from "../../lib/email";

interface Props {
  onSend: (email: string) => Promise<void> | void;
  onBack?: () => void;
  defaultEmail?: string;
}

function MagicLinkRequestScreen({ onSend, onBack, defaultEmail = "" }: Props) {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  const isValid = isValidEmail(email);
  const showFormatError = touched && email.trim() !== "" && !isValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || sending) return;

    setSending(true);
    setSendFailed(false);
    try {
      await onSend(normalizeEmail(email));
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      id="magic-link-request__main--root"
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-4 pb-8 text-ink"
    >
      <TopBar id="magic-link-request__topbar--main" onBack={onBack} />
      <form
        id="magic-link-request__form--main"
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-6 pt-4"
      >
        <div className="flex flex-col gap-2">
          <h1 id="magic-link-request__title--main" className="font-display text-title font-bold">
            {t("magicLink.request.title")}
          </h1>
          <p id="magic-link-request__text--intro" className="text-sm text-ink-secondary">
            {t("magicLink.request.intro")}
          </p>
        </div>

        <TextField
          id="magic-link-request__input--email"
          label={t("magicLink.request.emailLabel")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("magicLink.request.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={showFormatError ? t("magicLink.request.formatError") : undefined}
          disabled={sending}
        />

        {sendFailed && (
          <Callout id="magic-link-request__callout--error" tone="error">
            {t("magicLink.request.sendError")}
          </Callout>
        )}

        <Button
          id="magic-link-request__button--send"
          type="submit"
          fullWidth
          disabled={!isValid}
          loading={sending}
          loadingLabel={t("magicLink.request.sending")}
          className="mt-auto"
        >
          {t("magicLink.request.send")}
        </Button>
      </form>
    </main>
  );
}

export default MagicLinkRequestScreen;
