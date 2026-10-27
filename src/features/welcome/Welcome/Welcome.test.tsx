import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Welcome from "./Welcome";

function renderWelcome() {
  const props = { onSignUp: vi.fn(), onSignIn: vi.fn(), onDiscover: vi.fn() };
  const utils = render(<Welcome {...props} />);
  return { ...utils, props };
}

async function openAbout() {
  await userEvent.click(screen.getByRole("button", { name: "Sidéra" }));
  return screen.getByRole("dialog", { name: "Qui est Sidéra ?" });
}

describe("Welcome", () => {
  it("renders the title, actions and the account-later mention", () => {
    renderWelcome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Votre thème astral, lu simplement." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer mon compte" })).toHaveAttribute(
      "id",
      "welcome__button--sign-up",
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Découvrir sans compte" })).toBeInTheDocument();
    expect(screen.getByText(/créer un compte plus tard/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers the matching callback for each action", async () => {
    const { props } = renderWelcome();

    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await userEvent.click(screen.getByRole("button", { name: "Découvrir sans compte" }));

    expect(props.onSignUp).toHaveBeenCalledTimes(1);
    expect(props.onSignIn).toHaveBeenCalledTimes(1);
    expect(props.onDiscover).toHaveBeenCalledTimes(1);
  });

  it("offers the privacy policy link only when a handler is provided", async () => {
    const onPrivacy = vi.fn();
    const { unmount } = render(<Welcome onSignUp={vi.fn()} onSignIn={vi.fn()} onDiscover={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Politique de confidentialité" })).not.toBeInTheDocument();
    unmount();

    render(<Welcome onSignUp={vi.fn()} onSignIn={vi.fn()} onDiscover={vi.fn()} onPrivacy={onPrivacy} />);
    await userEvent.click(screen.getByRole("button", { name: "Politique de confidentialité" }));

    expect(onPrivacy).toHaveBeenCalledTimes(1);
  });

  it("shows the discovery error when the anonymous session could not start", () => {
    render(
      <Welcome onSignUp={vi.fn()} onSignIn={vi.fn()} onDiscover={vi.fn()} discoverError="Session anonyme non créée." />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Session anonyme non créée.");
  });

  it("opens the « Qui est Sidéra ? » sheet from the wordmark", async () => {
    renderWelcome();

    const dialog = await openAbout();

    expect(dialog).toHaveAttribute("id", "welcome__sheet--about");
    expect(screen.getByText(/jamais des certitudes/)).toBeInTheDocument();
  });

  it("closes the sheet with the « Fermer » button and restores focus", async () => {
    renderWelcome();
    const wordmark = screen.getByRole("button", { name: "Sidéra" });

    await openAbout();
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(wordmark).toHaveFocus();
  });

  it("closes the sheet with its header close button", async () => {
    renderWelcome();

    await openAbout();
    await userEvent.click(screen.getByRole("button", { name: "Fermer la fiche" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the sheet with Escape", async () => {
    renderWelcome();

    await openAbout();
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the sheet when clicking the overlay", async () => {
    const { container } = renderWelcome();

    await openAbout();
    const overlay = container.querySelector(".bg-overlay");
    if (!overlay) throw new Error("overlay not rendered");
    await userEvent.click(overlay);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
