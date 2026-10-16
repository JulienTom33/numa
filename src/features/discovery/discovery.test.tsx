import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConversionSheet from "./ConversionSheet";
import DiscoveryBanner from "./DiscoveryBanner";
import DiscoveryConsultGate from "./DiscoveryConsultGate";
import DiscoveryQuotaGate from "./DiscoveryQuotaGate";
import MigrationScreen from "./MigrationScreen";

vi.mock("../../hooks/useQuestionQuota", () => ({
  useQuestionQuota: () => ({ quota: { limit: 2, used: 2, remaining: 0 } }),
}));

afterEach(() => window.localStorage.clear());

const quota = (remaining: number) => ({ limit: 2, used: 2 - remaining, remaining });

describe("DiscoveryBanner", () => {
  it("annonce la lecture gratuite restante", () => {
    render(<DiscoveryBanner />);
    expect(screen.getByText("Il vous reste 1 lecture gratuite")).toBeInTheDocument();
  });
});

describe("ConversionSheet", () => {
  it("expose les trois actions et déclenche les callbacks", () => {
    const onSignUp = vi.fn();
    const onSignIn = vi.fn();
    const onContinue = vi.fn();
    render(<ConversionSheet open onSignUp={onSignUp} onSignIn={onSignIn} onContinue={onContinue} />);

    expect(screen.getByRole("dialog", { name: "Gardez votre lecture avec vous" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Créer un compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    fireEvent.click(screen.getByText("Continuer sans compte"));
    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("ne rend rien fermée", () => {
    render(<ConversionSheet open={false} onSignUp={vi.fn()} onSignIn={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

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

describe("DiscoveryConsultGate", () => {
  it("lit le quota via le hook serveur", () => {
    render(<DiscoveryConsultGate onSignUp={vi.fn()} onSignIn={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("MigrationScreen", () => {
  it("liste les éléments conservés et confirme l'accès", () => {
    const onContinue = vi.fn();
    render(<MigrationScreen onContinue={onContinue} />);

    expect(screen.getByRole("heading", { name: "Votre espace est prêt" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Accéder à mon espace" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
