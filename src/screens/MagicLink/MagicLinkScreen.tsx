import { useState } from "react";
import MagicLinkConfirmationScreen from "./MagicLinkConfirmationScreen";
import MagicLinkRequestScreen from "./MagicLinkRequestScreen";

interface Props {
  onSend: (email: string) => Promise<void> | void;
  onResend: (email: string) => Promise<void> | void;
  onOpenSpace: () => void;
  onBack?: () => void;
  resendCooldownSeconds?: number;
}

function MagicLinkScreen({ onSend, onResend, onOpenSpace, onBack, resendCooldownSeconds }: Props) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");

  async function handleSend(email: string) {
    // Une erreur levée par onSend remonte à l'écran de saisie, qui l'affiche sans changer d'étape.
    await onSend(email);
    setLastEmail(email);
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <MagicLinkConfirmationScreen
        email={sentTo}
        onOpenSpace={onOpenSpace}
        onResend={onResend}
        onBack={() => setSentTo(null)}
        resendCooldownSeconds={resendCooldownSeconds}
      />
    );
  }

  return <MagicLinkRequestScreen onSend={handleSend} onBack={onBack} defaultEmail={lastEmail} />;
}

export default MagicLinkScreen;
