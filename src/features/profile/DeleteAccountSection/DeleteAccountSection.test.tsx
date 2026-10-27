import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeleteAccountSection from "./DeleteAccountSection";

function renderSection(overrides: Partial<Parameters<typeof DeleteAccountSection>[0]> = {}) {
  const onConfirm = vi.fn();
  const onReset = vi.fn();
  render(<DeleteAccountSection deleting={false} errorCode={null} onConfirm={onConfirm} onReset={onReset} {...overrides} />);
  return { onConfirm, onReset };
}

describe("DeleteAccountSection", () => {
  it("n'ouvre la confirmation qu'au clic", async () => {
    renderSection();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Seront supprimés");
  });

  it("exige la saisie du mot de confirmation", async () => {
    const { onConfirm } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    const confirm = screen.getByRole("button", { name: "Supprimer définitivement mon compte" });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Pour confirmer/), "supprimer");
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("annule et réinitialise l'erreur", async () => {
    const { onConfirm, onReset } = renderSection();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    await userEvent.click(screen.getByRole("button", { name: "Garder mon compte" }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("affiche l'erreur en précisant que le compte est conservé", async () => {
    renderSection({ errorCode: "network_error" });
    await userEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    expect(screen.getByRole("alert")).toHaveTextContent("n'a pas été supprimé");
  });
});
