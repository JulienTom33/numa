import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeleteConversationSheet from "./DeleteConversationSheet";

function renderSheet(overrides: Partial<Parameters<typeof DeleteConversationSheet>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <DeleteConversationSheet
      open
      title="Ma question"
      deleting={false}
      errorCode={null}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe("DeleteConversationSheet", () => {
  it("ne s'affiche pas fermée", () => {
    renderSheet({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explique ce qui est supprimé et déclenche confirmation ou annulation", async () => {
    const { onConfirm, onCancel } = renderSheet();
    expect(document.getElementById("delete-conversation__text--message")).toHaveTextContent("« Ma question »");

    await userEvent.click(screen.getByRole("button", { name: "Supprimer la conversation" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Conserver" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("affiche l'erreur de suppression", () => {
    renderSheet({ errorCode: "delete_failed" });
    expect(screen.getByRole("alert")).toHaveTextContent("n'a pas pu être supprimée");
  });
});
