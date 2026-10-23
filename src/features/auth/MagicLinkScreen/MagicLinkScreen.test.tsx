import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MagicLinkScreen from "./MagicLinkScreen";

async function sendLink(email: string) {
  await userEvent.type(screen.getByLabelText("Adresse email"), email);
  await userEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
}

describe("MagicLinkScreen", () => {
  it("shows the confirmation once the link is sent", async () => {
    const onSend = vi.fn();
    render(<MagicLinkScreen onSend={onSend} onResend={vi.fn()} onOpenSpace={vi.fn()} />);

    await sendLink("lea@example.fr");

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("lea@example.fr");
    expect(
      await screen.findByRole("heading", { name: "Vérifiez votre boîte mail" }),
    ).toBeInTheDocument();
    expect(screen.getByText("lea@example.fr")).toBeInTheDocument();
  });

  it("stays on the request screen when sending fails", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("network"));
    render(<MagicLinkScreen onSend={onSend} onResend={vi.fn()} onOpenSpace={vi.fn()} />);

    await sendLink("lea@example.fr");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Connexion par lien magique" }),
    ).toBeInTheDocument();
  });

  it("forwards the send error message to the request screen", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("rate_limited"));
    render(
      <MagicLinkScreen
        onSend={onSend}
        onResend={vi.fn()}
        onOpenSpace={vi.fn()}
        sendErrorMessage="Trop de tentatives."
      />,
    );

    await sendLink("lea@example.fr");

    expect(await screen.findByRole("alert")).toHaveTextContent("Trop de tentatives.");
  });

  it("returns to the request screen with the address prefilled", async () => {
    render(<MagicLinkScreen onSend={vi.fn()} onResend={vi.fn()} onOpenSpace={vi.fn()} />);

    await sendLink("lea@example.fr");
    await userEvent.click(
      await screen.findByRole("button", { name: "Modifier l'adresse email" }),
    );

    expect(screen.getByLabelText("Adresse email")).toHaveValue("lea@example.fr");
  });

  it("forwards resend, open space and back actions", async () => {
    const onResend = vi.fn();
    const onOpenSpace = vi.fn();
    const onBack = vi.fn();
    render(
      <MagicLinkScreen
        onSend={vi.fn()}
        onResend={onResend}
        onOpenSpace={onOpenSpace}
        onBack={onBack}
        resendCooldownSeconds={0}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));
    expect(onBack).toHaveBeenCalledOnce();

    await sendLink("lea@example.fr");
    await userEvent.click(await screen.findByRole("button", { name: "Renvoyer le lien" }));
    await userEvent.click(screen.getByRole("button", { name: "Accéder à mon espace" }));

    expect(onResend).toHaveBeenCalledOnce();
    expect(onResend).toHaveBeenCalledWith("lea@example.fr");
    expect(onOpenSpace).toHaveBeenCalledOnce();
  });
});
