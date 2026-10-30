import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppContext, type AppContextValue } from "../../../shared/navigation/appContext/appContext";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { deleteAccount } from "../accountService/accountService";
import { authenticatedProfile } from "../profileData/profileFixtures";
import { fetchProfile, saveProfile } from "../profileService/profileService";
import ProfileFlow from "./ProfileFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));
const chartMock = vi.hoisted(() => ({
  status: "ready",
  retry: vi.fn(),
}));

vi.mock("../../chart/useMyChart/useMyChart", () => ({
  useMyChart: () => ({
    status: chartMock.status,
    data: { summary: { sun: { sign: "pisces" }, ascendant: { sign: "taurus" }, confidence: "high" }, natal: { bodies: [], ascendantLongitude: null, midheavenLongitude: null, aspects: [], cusps: null }, transits: null },
    errorCode: chartMock.status === "error" ? "internal_error" : null,
    retry: chartMock.retry,
  }),
}));
vi.mock("../profileService/profileService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileService/profileService")>()),
  fetchProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock("../accountService/accountService", () => ({ deleteAccount: vi.fn() }));

const signOut = vi.fn();

const session = { user: { id: "user-1", email: "camille@example.com" } } as unknown as Session;

function renderFlow() {
  const Wrapper = createQueryWrapper();
  const context = { session, auth: { signOut } } as unknown as AppContextValue;
  render(
    <Wrapper>
      <AppContext.Provider value={context}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<ProfileFlow search={vi.fn().mockResolvedValue([])} />} />
            <Route path="/historique" element={<p id="test__text--history">Historique</p>} />
          </Routes>
        </MemoryRouter>
      </AppContext.Provider>
    </Wrapper>,
  );
}

describe("ProfileFlow", () => {
  beforeEach(() => {
    chartMock.status = "ready";
    chartMock.retry.mockClear();
    signOut.mockReset();
    vi.mocked(deleteAccount).mockReset();
    vi.mocked(saveProfile).mockClear();
    vi.mocked(fetchProfile).mockResolvedValue({ data: authenticatedProfile, error: null });
    vi.mocked(saveProfile).mockResolvedValue({ error: null });
  });

  it("supprime le compte après confirmation puis termine la session", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ error: null });
    signOut.mockResolvedValue(null);
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Supprimer mon compte" }));
    await userEvent.type(screen.getByLabelText(/Pour confirmer/), "supprimer");
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement mon compte" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("signale l'échec sans terminer la session", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ error: "delete_failed" });
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Supprimer mon compte" }));
    await userEvent.type(screen.getByLabelText(/Pour confirmer/), "supprimer");
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement mon compte" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("n'a pas été supprimé");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("ouvre l'historique depuis l'entrée Mes conversations", async () => {
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Mes conversations" }));
    expect(screen.getByText("Historique")).toBeInTheDocument();
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

  it("demande confirmation avant d'enregistrer de nouvelles données de naissance", async () => {
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Modifier mon profil" }));
    await userEvent.selectOptions(screen.getByLabelText("Année"), "1985");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(saveProfile).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirmer et recalculer" }));

    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Vos modifications sont enregistrées.")).toBeInTheDocument();
  });

  it("propose de réessayer le recalcul du thème en cas d'échec", async () => {
    chartMock.status = "error";
    renderFlow();

    expect(await screen.findByRole("alert")).toHaveTextContent("le recalcul de votre thème a échoué");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(chartMock.retry).toHaveBeenCalledTimes(1);
  });

  it("reste dans le formulaire avec l'erreur si l'enregistrement échoue", async () => {
    vi.mocked(saveProfile).mockResolvedValue({ error: "save_failed" });
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: "Modifier mon profil" }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("n'ont pas pu être enregistrées");
  });
});
