import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { UseConversationMessagesResult } from "../useConversationMessages/useConversationMessages";
import ConversationDetail from "./ConversationDetail";

const DATA = {
  conversation: { id: "c1", title: "Ma question", updatedAt: "2026-10-20T10:00:00Z" },
  messages: [
    { id: "m1", author: "user" as const, text: "Première", createdAt: "2026-10-20T10:00:00Z" },
    { id: "m2", author: "sidera" as const, text: "Seconde", createdAt: "2026-10-20T10:00:05Z" },
  ],
};

function result(overrides: Partial<UseConversationMessagesResult>): UseConversationMessagesResult {
  return { status: "ready", data: DATA, errorCode: null, retry: vi.fn(), ...overrides };
}

describe("ConversationDetail", () => {
  it("affiche un état de chargement", () => {
    render(<ConversationDetail result={result({ status: "loading", data: null })} onBack={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement de la conversation");
  });

  it("affiche les messages dans l'ordre reçu", () => {
    render(<ConversationDetail result={result({})} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Ma question" })).toBeInTheDocument();
    const articles = screen.getAllByRole("article");
    expect(articles[0]).toHaveTextContent("Première");
    expect(articles[1]).toHaveTextContent("Seconde");
  });

  it("affiche un message si la conversation est vide", () => {
    render(<ConversationDetail result={result({ data: { ...DATA, messages: [] } })} onBack={vi.fn()} />);
    expect(screen.getByText("Cette conversation ne contient aucun message.")).toBeInTheDocument();
  });

  it("propose de réessayer après une erreur réseau", async () => {
    const retry = vi.fn();
    render(<ConversationDetail result={result({ status: "error", data: null, errorCode: "network_error", retry })} onBack={vi.fn()} />);
    expect(screen.getByText(/Impossible de charger/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalled();
  });

  it("n'offre pas de nouvel essai pour une conversation introuvable et permet de revenir", async () => {
    const onBack = vi.fn();
    render(
      <ConversationDetail result={result({ status: "error", data: null, errorCode: "conversation_not_found" })} onBack={onBack} />,
    );
    expect(screen.queryByRole("button", { name: "Réessayer" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retour aux conversations" }));
    expect(onBack).toHaveBeenCalled();
  });
});
