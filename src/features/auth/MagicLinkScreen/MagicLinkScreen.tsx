import { useState } from "react";
import MagicLinkConfirmationScreen from "../MagicLinkConfirmationScreen/MagicLinkConfirmationScreen";
import MagicLinkRequestScreen from "../MagicLinkRequestScreen/MagicLinkRequestScreen";

interface Props {
  onSend: (email: string) => Promise<void> | void;
  onResend: (email: string) => Promise<void> | void;
  onOpenSpace: () => void;
  onBack?: () => void;
  resendCooldownSeconds?: number;
  sendErrorMessage?: string | null;
}

function MagicLinkScreen({
  onSend,
  onResend,
  onOpenSpace,
  onBack,
  resendCooldownSeconds,
  sendErrorMessage,
}: Props) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");

  async function handleSend(email: string) {
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

  return (
    <MagicLinkRequestScreen
      onSend={handleSend}
      onBack={onBack}
      defaultEmail={lastEmail}
      errorMessage={sendErrorMessage}
    />
  );
}

export default MagicLinkScreen;
