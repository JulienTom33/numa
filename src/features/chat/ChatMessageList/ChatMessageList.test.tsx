import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChatMessageList from "./ChatMessageList";

describe("ChatMessageList", () => {
  it("rend les messages avec leur identifiant et annonce le journal", () => {
    render(
      <ChatMessageList
        sending={false}
        messages={[
          { id: "m1", author: "user", text: "Bonjour" },
          { id: "m2", author: "numa", text: "Salutations" },
        ]}
      />,
    );

    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
    expect(document.getElementById("chat-message-list__message--m1")).toHaveTextContent("Bonjour");
    expect(document.getElementById("chat-message-list__message--m2")).toHaveTextContent("Salutations");
  });

  it("affiche l'indicateur d'écriture pendant l'envoi", () => {
    render(<ChatMessageList messages={[]} sending />);
    expect(screen.getByText("Numa écrit…")).toBeInTheDocument();
  });
});
