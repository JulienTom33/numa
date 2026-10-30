import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ChatMessageList from "./ChatMessageList";

describe("ChatMessageList", () => {
  it("rend les messages avec leur identifiant et annonce le journal", () => {
    render(
      <ChatMessageList
        sending={false}
        messages={[
          { id: "m1", author: "user", text: "Bonjour" },
          { id: "m2", author: "sidera", text: "Salutations" },
        ]}
      />,
    );

    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
    expect(document.getElementById("chat-message-list__message--m1")).toHaveTextContent("Bonjour");
    expect(document.getElementById("chat-message-list__message--m2")).toHaveTextContent("Salutations");
  });

  it("propose le fondement et sans la période sous la réponse quand le fondement est connu", async () => {
    render(
      <ChatMessageList
        sending={false}
        messages={[
          { id: "m1", author: "sidera", text: "Sans fondement" },
          { id: "m2", author: "sidera", text: "Avec fondement", basis: null },
        ]}
      />,
    );

    expect(document.getElementById("chat-message-list__message--m1-why")).toBeNull();
    const toggle = document.getElementById("chat-message-list__message--m2-why");
    expect(toggle).toHaveTextContent("Pourquoi cette réponse ?");
    expect(screen.getByText(/Période concernée/)).not.toBeVisible();
    await userEvent.click(toggle as HTMLElement);
    expect(screen.getByText(/Période concernée/)).toBeVisible();
    expect(screen.getByText(/Aucun thème natal n'était disponible/)).toBeVisible();
  });

  it("affiche l'indicateur d'écriture pendant l'envoi", () => {
    render(<ChatMessageList messages={[]} sending />);
    expect(screen.getByText("Sidéra écrit…")).toBeInTheDocument();
  });
});
