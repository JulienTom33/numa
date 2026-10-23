import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DiscoveryQuotaGate from "./DiscoveryQuotaGate";

afterEach(() => window.localStorage.clear());

const quota = (remaining: number) => ({ limit: 2, used: 2 - remaining, remaining });

describe("DiscoveryQuotaGate", () => {
  const renderGate = (remaining: number | null) =>
    render(
      <DiscoveryQuotaGate
        quota={remaining === null ? null : quota(remaining)}
        onSignUp={vi.fn()}
        onSignIn={vi.fn()}
      />,
    );

  it("ne rend rien sans quota ou avec plus d'une lecture restante", () => {
    const { container, unmount } = renderGate(null);
    expect(container).toBeEmptyDOMElement();
    unmount();
    const second = renderGate(2);
    expect(second.container).toBeEmptyDOMElement();
  });

  it("affiche le bandeau quand il reste une lecture", () => {
    renderGate(1);
    expect(screen.getByText("Il vous reste 1 lecture gratuite")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("affiche la fiche et le bouton quand il ne reste rien", () => {
    renderGate(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer un compte pour continuer" })).toBeInTheDocument();
  });

  it("continuer sans compte ferme la fiche et ne la rouvre pas au remontage", () => {
    const first = renderGate(0);
    fireEvent.click(screen.getByText("Continuer sans compte"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer un compte pour continuer" })).toBeInTheDocument();
    first.unmount();

    renderGate(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
