import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ChatBubble from "./ChatBubble";

describe("ChatBubble", () => {
  it("labels the message with its author", () => {
    render(
      <ChatBubble id="test__bubble--1" author="user">
        Comment se présente ma semaine ?
      </ChatBubble>,
    );

    expect(screen.getByRole("article", { name: "Vous" })).toHaveTextContent(
      "Comment se présente ma semaine ?",
    );
  });

  it("styles user and Sidéra messages differently", () => {
    render(
      <>
        <ChatBubble id="test__bubble--1" author="user">
          Question
        </ChatBubble>
        <ChatBubble id="test__bubble--2" author="sidera">
          Réponse
        </ChatBubble>
      </>,
    );

    expect(screen.getByRole("article", { name: "Vous" })).toHaveClass("bg-ink");
    expect(screen.getByRole("article", { name: "Sidéra" })).toHaveClass("bg-white");
  });

  it("shows the period and an expandable explanation", async () => {
    render(
      <ChatBubble
        id="test__bubble--2"
        author="sidera"
        period="du 14 au 20 octobre"
        why="Vénus en trigone à votre Lune"
      >
        Une semaine propice aux échanges.
      </ChatBubble>,
    );

    expect(screen.getByText("du 14 au 20 octobre")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pourquoi cette réponse ?" }));
    expect(screen.getByRole("region")).toHaveTextContent("Vénus en trigone à votre Lune");
  });

  it("shows a busy typing indicator while pending", () => {
    render(
      <ChatBubble id="test__bubble--3" author="sidera" pending period="demain" why="raison">
        Ignoré
      </ChatBubble>,
    );
    const bubble = screen.getByRole("article", { name: "Sidéra" });

    expect(bubble).toHaveAttribute("aria-busy", "true");
    expect(bubble).toHaveTextContent("Sidéra écrit…");
    expect(screen.queryByText("Ignoré")).not.toBeInTheDocument();
    expect(screen.queryByText("demain")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
