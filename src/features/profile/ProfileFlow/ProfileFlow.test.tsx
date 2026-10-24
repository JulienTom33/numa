import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppContext, type AppContextValue } from "../../../shared/navigation/appContext/appContext";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { authenticatedProfile } from "../profileData/profileFixtures";
import { fetchProfile, saveProfile } from "../profileService/profileService";
import ProfileFlow from "./ProfileFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));
vi.mock("../../chart/useMyChart/useMyChart", () => ({
  useMyChart: () => ({
    status: "ready",
    data: { summary: { sun: { sign: "pisces" }, ascendant: { sign: "taurus" } } },
    errorCode: null,
    retry: vi.fn(),
  }),
}));
vi.mock("../profileService/profileService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileService/profileService")>()),
  fetchProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

const session = { user: { id: "user-1", email: "camille@example.com" } } as unknown as Session;

function renderFlow() {
  const Wrapper = createQueryWrapper();
  const context = { session } as unknown as AppContextValue;
  render(
    <Wrapper>
      <AppContext.Provider value={context}>
        <ProfileFlow search={vi.fn().mockResolvedValue([])} />
      </AppContext.Provider>
    </Wrapper>,
  );
}

describe("ProfileFlow", () => {
  beforeEach(() => {
    vi.mocked(fetchProfile).mockResolvedValue({ data: authenticatedProfile, error: null });
    vi.mocked(saveProfile).mockResolvedValue({ error: null });
  });

  it("charge puis affiche le profil", async () => {
    renderFlow();

    expect(screen.getByRole("status")).toHaveTextContent("Chargement");
    expect(await screen.findByRole("heading", { level: 1, name: "Camille" })).toBeInTheDocument();
    expect(document.getElementById("profile__text--placements")).toHaveTextContent("Soleil Poissons");
  });

  it("propose de réessayer après une erreur de chargement", async () => {
    vi.mocked(fetchProfile).mockResolvedValueOnce({ data: null, error: "network_error" });
    renderFlow();

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de charger votre profil");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Camille" })).toBeInTheDocument();
  });

  it("modifie le prénom, confirme le succès et revient à la lecture", async () => {
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Modifier mon profil" }));

    const input = screen.getByLabelText("Prénom");
    await userEvent.clear(input);
    await userEvent.type(input, "Léa");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Léa" })).toBeInTheDocument());
    expect(screen.getByText("Vos modifications sont enregistrées.")).toBeInTheDocument();
  });

  it("reste dans le formulaire avec l'erreur si l'enregistrement échoue", async () => {
    vi.mocked(saveProfile).mockResolvedValue({ error: "save_failed" });
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Modifier mon profil" }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("n'ont pas pu être enregistrées");
  });
});
