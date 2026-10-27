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
const chartMock = vi.hoisted(() => ({
  status: "ready",
  retry: vi.fn(),
}));

vi.mock("../../chart/useMyChart/useMyChart", () => ({
  useMyChart: () => ({
    status: chartMock.status,
    data: { summary: { sun: { sign: "pisces" }, ascendant: { sign: "taurus" } } },
    errorCode: chartMock.status === "error" ? "internal_error" : null,
    retry: chartMock.retry,
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
    chartMock.status = "ready";
    chartMock.retry.mockClear();
    vi.mocked(saveProfile).mockClear();
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
