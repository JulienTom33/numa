import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MagicLinkRequestScreen from "./MagicLinkRequestScreen";

function getEmailInput() {
  return screen.getByLabelText("Adresse email");
}

function getSendButton() {
  return screen.getByRole("button", { name: "Envoyer le lien" });
}

describe("MagicLinkRequestScreen", () => {
  it("renders the title and an email field linked to its label", () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Connexion par lien magique" }),
    ).toBeInTheDocument();
    expect(getEmailInput()).toHaveAttribute("id", "magic-link-request__input--email");
    expect(getEmailInput()).toHaveAttribute("type", "email");
  });

  it("keeps the send button disabled while the address is empty or malformed", async () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    expect(getSendButton()).toBeDisabled();

    await userEvent.type(getEmailInput(), "lea@");
    expect(getSendButton()).toBeDisabled();

    await userEvent.type(getEmailInput(), "example");
    expect(getSendButton()).toBeDisabled();
  });

  it("enables the send button once the address is valid", async () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    await userEvent.type(getEmailInput(), "lea@example.fr");

    expect(getSendButton()).toBeEnabled();
  });

  it("shows a format error only after leaving the field", async () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    await userEvent.type(getEmailInput(), "lea@example");
    expect(getEmailInput()).not.toHaveAttribute("aria-invalid");

    await userEvent.tab();
    expect(getEmailInput()).toHaveAttribute("aria-invalid", "true");
    expect(getEmailInput()).toHaveAccessibleDescription(
      "Saisissez une adresse email complète, par exemple prenom@exemple.fr.",
    );
  });

  it("does not flag an empty field as invalid", async () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    await userEvent.click(getEmailInput());
    await userEvent.tab();

    expect(getEmailInput()).not.toHaveAttribute("aria-invalid");
  });

  it("sends the trimmed address on submit", async () => {
    const onSend = vi.fn();
    render(<MagicLinkRequestScreen onSend={onSend} />);

    await userEvent.type(getEmailInput(), "  lea@example.fr ");
    await userEvent.click(getSendButton());

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("lea@example.fr");
  });

  it("submits with the Enter key", async () => {
    const onSend = vi.fn();
    render(<MagicLinkRequestScreen onSend={onSend} />);

    await userEvent.type(getEmailInput(), "lea@example.fr{Enter}");

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("lea@example.fr");
  });

  it("does not send an invalid address with the Enter key", async () => {
    const onSend = vi.fn();
    render(<MagicLinkRequestScreen onSend={onSend} />);

    await userEvent.type(getEmailInput(), "lea@example{Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows a loading state while sending and ignores repeated submissions", async () => {
    let resolveSend: () => void = () => undefined;
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    );
    render(<MagicLinkRequestScreen onSend={onSend} />);

    await userEvent.type(getEmailInput(), "lea@example.fr");
    await userEvent.click(getSendButton());

    const sendingButton = screen.getByRole("button", { name: "Envoi en cours…" });
    expect(sendingButton).toBeDisabled();
    expect(sendingButton).toHaveAttribute("aria-busy", "true");
    expect(getEmailInput()).toBeDisabled();

    resolveSend();
    expect(await screen.findByRole("button", { name: "Envoyer le lien" })).toBeEnabled();
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("shows an error and lets the user retry when sending fails", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);
    render(<MagicLinkRequestScreen onSend={onSend} />);

    await userEvent.type(getEmailInput(), "lea@example.fr");
    await userEvent.click(getSendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("L'envoi du lien a échoué.");

    await userEvent.click(getSendButton());

    expect(onSend).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the caller's error message when sending fails", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("rate_limited"));
    render(<MagicLinkRequestScreen onSend={onSend} errorMessage="Trop de tentatives." />);

    await userEvent.type(getEmailInput(), "lea@example.fr");
    await userEvent.click(getSendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Trop de tentatives.");
  });

  it("prefills the address", () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} defaultEmail="lea@example.fr" />);

    expect(getEmailInput()).toHaveValue("lea@example.fr");
    expect(getSendButton()).toBeEnabled();
  });

  it("calls onBack from the top bar", async () => {
    const onBack = vi.fn();
    render(<MagicLinkRequestScreen onSend={vi.fn()} onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("hides the back button without onBack", () => {
    render(<MagicLinkRequestScreen onSend={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Retour" })).not.toBeInTheDocument();
  });
});
