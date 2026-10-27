import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { authenticatedProfile } from "../profileData/profileFixtures";
import type { ProfileErrorCode } from "../profileData/profileData";
import ProfileEditForm from "./ProfileEditForm";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

const TODAY = new Date(2026, 9, 24);

function renderForm(errorCode: ProfileErrorCode | null = null, saving = false) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <ProfileEditForm
      profile={authenticatedProfile}
      search={vi.fn().mockResolvedValue([])}
      saving={saving}
      errorCode={errorCode}
      onSave={onSave}
      onCancel={onCancel}
      today={TODAY}
    />,
  );
  return { onSave, onCancel };
}

describe("ProfileEditForm", () => {
  it("préremplit les champs sans avertissement tant que la naissance est inchangée", () => {
    renderForm();

    expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
    expect(screen.getByLabelText("Année")).toHaveValue("1990");
    expect(document.getElementById("profile-edit__callout--birth-warning")).toBeNull();
  });

  it("enregistre des préférences sans données de naissance", async () => {
    const { onSave } = renderForm();

    await userEvent.click(screen.getByRole("radio", { name: "Direct" }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSave).toHaveBeenCalledWith({ firstName: "Camille", language: "fr", tone: "direct", birth: null });
  });

  it("avertit quand la naissance change et n'enregistre qu'après confirmation", async () => {
    const { onSave } = renderForm();

    await userEvent.selectOptions(screen.getByLabelText("Année"), "1985");

    expect(document.getElementById("profile-edit__callout--birth-warning")).toHaveTextContent("recalculé");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Recalculer votre thème");

    await userEvent.click(screen.getByRole("button", { name: "Confirmer et recalculer" }));
    expect(onSave.mock.calls[0][0].birth.birthDate).toBe("1985-03-12");
  });

  it("permet de revenir sur la confirmation sans enregistrer", async () => {
    const { onSave } = renderForm();

    await userEvent.selectOptions(screen.getByLabelText("Année"), "1985");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await userEvent.click(screen.getByRole("button", { name: "Revenir" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("bloque l'enregistrement et affiche les erreurs de validation", async () => {
    const { onSave } = renderForm();

    await userEvent.clear(screen.getByLabelText("Prénom"));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(document.getElementById("profile-edit__input--first-name-error")).toBeInTheDocument();
  });

  it("affiche l'erreur d'enregistrement et permet d'annuler", async () => {
    const { onCancel } = renderForm("save_failed");

    expect(screen.getByRole("alert")).toHaveTextContent("Vos modifications n'ont pas pu être enregistrées");
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("désactive l'enregistrement en cours", () => {
    renderForm(null, true);
    expect(screen.getByRole("button", { name: "Enregistrement…" })).toBeDisabled();
  });
});
