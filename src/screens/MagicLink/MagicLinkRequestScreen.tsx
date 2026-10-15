import { type FormEvent, useState } from "react";
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

const SEND_ERROR_MESSAGE = "L'envoi du lien a échoué. Vérifiez votre connexion puis réessayez.";
const FORMAT_ERROR_MESSAGE = "Saisissez une adresse email complète, par exemple prenom@exemple.fr.";

function MagicLinkRequestScreen({ onSend, onBack, defaultEmail = "" }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  const isValid = isValidEmail(email);
  // L'erreur de format n'apparaît qu'après la sortie du champ, pour ne pas sanctionner la saisie en cours.
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
            Connexion par lien magique
          </h1>
          <p id="magic-link-request__text--intro" className="text-sm text-ink-secondary">
            Saisissez votre adresse email : nous vous envoyons un lien pour vous connecter, sans mot
            de passe.
          </p>
        </div>

        <TextField
          id="magic-link-request__input--email"
          label="Adresse email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="prenom@exemple.fr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={showFormatError ? FORMAT_ERROR_MESSAGE : undefined}
          disabled={sending}
        />

        {sendFailed && (
          <Callout id="magic-link-request__callout--error" tone="error">
            {SEND_ERROR_MESSAGE}
          </Callout>
        )}

        <Button
          id="magic-link-request__button--send"
          type="submit"
          fullWidth
          disabled={!isValid}
          loading={sending}
          loadingLabel="Envoi en cours…"
          className="mt-auto"
        >
          Envoyer le lien
        </Button>
      </form>
    </main>
  );
}

export default MagicLinkRequestScreen;
