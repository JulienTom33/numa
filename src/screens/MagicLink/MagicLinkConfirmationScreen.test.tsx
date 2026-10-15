import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MagicLinkConfirmationScreen, {
  DEFAULT_RESEND_COOLDOWN_SECONDS,
} from "./MagicLinkConfirmationScreen";

const EMAIL = "lea@example.fr";

// fireEvent plutôt que userEvent : sous les fake timers de Vitest, l'attente interne de
// userEvent (setTimeout non avancé) bloque le test.
async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

function getResendButton() {
  return screen.getByRole("button", { name: /Renvoyer le lien/ });
}

function advanceSeconds(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("MagicLinkConfirmationScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reminds the address the link was sent to", () => {
    render(<MagicLinkConfirmationScreen email={EMAIL} onOpenSpace={vi.fn()} onResend={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeInTheDocument();
    expect(screen.getByText(EMAIL)).toHaveAttribute("id", "magic-link-confirmation__text--address");
  });

  it("calls onOpenSpace", async () => {
    const onOpenSpace = vi.fn();
    render(
      <MagicLinkConfirmationScreen email={EMAIL} onOpenSpace={onOpenSpace} onResend={vi.fn()} />,
    );

    await click(screen.getByRole("button", { name: "Accéder à mon espace" }));

    expect(onOpenSpace).toHaveBeenCalledOnce();
  });

  it("waits the default cooldown before allowing a first resend", () => {
    render(<MagicLinkConfirmationScreen email={EMAIL} onOpenSpace={vi.fn()} onResend={vi.fn()} />);

    expect(getResendButton()).toBeDisabled();
    expect(getResendButton()).toHaveTextContent(
      `Renvoyer le lien (${DEFAULT_RESEND_COOLDOWN_SECONDS} s)`,
    );

    advanceSeconds(1);
    expect(getResendButton()).toHaveTextContent(
      `Renvoyer le lien (${DEFAULT_RESEND_COOLDOWN_SECONDS - 1} s)`,
    );

    advanceSeconds(DEFAULT_RESEND_COOLDOWN_SECONDS - 1);
    expect(getResendButton()).toBeEnabled();
    expect(getResendButton()).toHaveTextContent(/^Renvoyer le lien$/);
  });

  it("resends the link, confirms it visibly and restarts the cooldown", async () => {
    const onResend = vi.fn();
    render(
      <MagicLinkConfirmationScreen
        email={EMAIL}
        onOpenSpace={vi.fn()}
        onResend={onResend}
        resendCooldownSeconds={30}
        initialCooldownSeconds={0}
      />,
    );

    await click(getResendButton());

    expect(onResend).toHaveBeenCalledOnce();
    expect(onResend).toHaveBeenCalledWith(EMAIL);
    expect(screen.getByRole("status")).toHaveTextContent(
      `Un nouveau lien vient d'être envoyé à ${EMAIL}.`,
    );
    expect(getResendButton()).toBeDisabled();
    expect(getResendButton()).toHaveTextContent("Renvoyer le lien (30 s)");

    await click(getResendButton());
    expect(onResend).toHaveBeenCalledOnce();

    advanceSeconds(29);
    expect(getResendButton()).toHaveTextContent("Renvoyer le lien (1 s)");

    advanceSeconds(1);
    expect(getResendButton()).toBeEnabled();

    await click(getResendButton());
    expect(onResend).toHaveBeenCalledTimes(2);
  });

  it("shows a loading state while resending", async () => {
    let resolveResend: () => void = () => undefined;
    const onResend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveResend = resolve;
        }),
    );
    render(
      <MagicLinkConfirmationScreen
        email={EMAIL}
        onOpenSpace={vi.fn()}
        onResend={onResend}
        initialCooldownSeconds={0}
      />,
    );

    await click(getResendButton());

    const resendingButton = screen.getByRole("button", { name: "Renvoi en cours…" });
    expect(resendingButton).toBeDisabled();
    expect(resendingButton).toHaveAttribute("aria-busy", "true");

    await act(async () => resolveResend());
    expect(getResendButton()).toHaveTextContent(
      `Renvoyer le lien (${DEFAULT_RESEND_COOLDOWN_SECONDS} s)`,
    );
  });

  it("shows an error without cooldown when resending fails", async () => {
    const onResend = vi.fn().mockRejectedValue(new Error("network"));
    render(
      <MagicLinkConfirmationScreen
        email={EMAIL}
        onOpenSpace={vi.fn()}
        onResend={onResend}
        initialCooldownSeconds={0}
      />,
    );

    await click(getResendButton());

    expect(screen.getByRole("alert")).toHaveTextContent("Le renvoi du lien a échoué.");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(getResendButton()).toBeEnabled();
  });

  it("lets the user go back to change the address", async () => {
    const onBack = vi.fn();
    render(
      <MagicLinkConfirmationScreen
        email={EMAIL}
        onOpenSpace={vi.fn()}
        onResend={vi.fn()}
        onBack={onBack}
      />,
    );

    await click(screen.getByRole("button", { name: "Modifier l'adresse email" }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
