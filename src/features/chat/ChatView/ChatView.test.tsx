import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { completeSummary } from "../../chart/ChartSummary/chartSummaryFixtures";
import ChatView from "./ChatView";

const base = {
  messages: [],
  sending: false,
  errorMessage: null,
  summary: completeSummary,
  quota: { limit: 2, used: 0, remaining: 2 },
  exhausted: false,
  draft: "",
  onDraftChange: vi.fn(),
  onSend: vi.fn(),
};

describe("ChatView", () => {
  it("état vide : invitation, suggestions, profil et quota", () => {
    render(<ChatView {...base} />);
    expect(screen.getByText("Posez votre question à Sidéra")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /\?$/ })).toHaveLength(5);
    expect(screen.getByText(/Profil analysé : Camille/)).toBeInTheDocument();
    expect(screen.getByText("2 questions gratuites restantes")).toBeInTheDocument();
  });

  it("envoie une suggestion", async () => {
    const onSend = vi.fn();
    render(<ChatView {...base} onSend={onSend} />);
    await userEvent.click(screen.getByRole("button", { name: "Comment se présente ma semaine ?" }));
    expect(onSend).toHaveBeenCalledWith("Comment se présente ma semaine ?");
  });

  it("envoi : saisie désactivée et indicateur affiché", () => {
    render(<ChatView {...base} sending messages={[{ id: "m1", author: "user", text: "Q" }]} />);
    expect(screen.getByLabelText("Votre question")).toBeDisabled();
    expect(screen.getByText("Sidéra écrit…")).toBeInTheDocument();
    expect(screen.queryByText("Posez votre question à Sidéra")).not.toBeInTheDocument();
  });

  it("succès : affiche la réponse", () => {
    render(
      <ChatView
        {...base}
        messages={[
          { id: "m1", author: "user", text: "Q" },
          { id: "m2", author: "sidera", text: "Réponse" },
        ]}
      />,
    );
    expect(screen.getByText("Réponse")).toBeInTheDocument();
  });

  it("erreur : affiche l'alerte", () => {
    render(<ChatView {...base} errorMessage="Le service est momentanément indisponible." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Le service est momentanément indisponible.");
  });

  it("quota atteint : saisie et suggestions bloquées", () => {
    render(<ChatView {...base} exhausted quota={{ limit: 2, used: 2, remaining: 0 }} />);
    expect(screen.getByLabelText("Votre question")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Comment se présente ma semaine ?" })).toBeDisabled();
    expect(screen.getByText("Vous avez utilisé vos questions gratuites.")).toBeInTheDocument();
  });
});
