import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import BottomSheet from "./BottomSheet";

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <BottomSheet
        id="test__sheet--about"
        open={open}
        title="Qui est Numa ?"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        footer={<button type="button">Créer un compte</button>}
      >
        Numa lit votre thème astral.
      </BottomSheet>
    </>
  );
}

describe("BottomSheet", () => {
  it("renders nothing when closed", () => {
    render(
      <BottomSheet id="test__sheet--about" open={false} title="Titre" onClose={vi.fn()}>
        Contenu
      </BottomSheet>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a labelled modal dialog and focuses its first control", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    const dialog = screen.getByRole("dialog", { name: "Qui est Numa ?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Fermer" })).toHaveFocus();
    expect(screen.getByText("Numa lit votre thème astral.")).toBeInTheDocument();
  });

  it("closes with the close button and restores focus to the trigger", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Ouvrir" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the overlay", async () => {
    const onClose = vi.fn();
    const { container } = render(<Harness onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    const overlay = container.querySelector(".bg-overlay");
    if (!overlay) throw new Error("overlay not rendered");
    await userEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps focus inside the sheet", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    const close = screen.getByRole("button", { name: "Fermer" });
    const footerAction = screen.getByRole("button", { name: "Créer un compte" });

    await userEvent.tab();
    expect(footerAction).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(footerAction).toHaveFocus();
  });

  it("ignores other keys", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    await userEvent.keyboard("a");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("leaves room for the tab bar when requested", () => {
    const { container } = render(
      <BottomSheet id="test__sheet--about" open title="Titre" onClose={vi.fn()} aboveTabBar>
        Contenu
      </BottomSheet>,
    );

    expect(container.firstChild).toHaveClass("bottom-16");
  });
});
