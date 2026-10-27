import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConversationList from "./ConversationList";

describe("ConversationList", () => {
  it("affiche l'état vide sans conversation", () => {
    render(<ConversationList conversations={[]} onOpen={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Aucune conversation pour l'instant")).toBeInTheDocument();
  });

  it("liste les conversations dans l'ordre reçu avec leur date", () => {
    render(
      <ConversationList
        conversations={[
          { id: "c2", title: "Récente", updatedAt: "2026-10-21T10:00:00Z" },
          { id: "c1", title: null, updatedAt: "2026-10-20T10:00:00Z" },
        ]}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Récente");
    expect(items[0]).toHaveTextContent("21 oct. 2026");
    expect(items[1]).toHaveTextContent("Conversation sans titre");
  });

  it("ouvre une conversation au clic", async () => {
    const onOpen = vi.fn();
    render(<ConversationList conversations={[{ id: "c1", title: "A", updatedAt: "2026-10-20T10:00:00Z" }]} onOpen={onOpen} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /^A/ }));
    expect(onOpen).toHaveBeenCalledWith("c1");
  });

  it("demande la suppression d'une conversation", async () => {
    const onDelete = vi.fn();
    render(
      <ConversationList
        conversations={[{ id: "c1", title: "A", updatedAt: "2026-10-20T10:00:00Z" }]}
        onOpen={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la conversation « A »" }));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});
