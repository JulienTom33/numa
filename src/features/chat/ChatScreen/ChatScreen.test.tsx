import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";
import { AppContext, type AppContextValue } from "../../../shared/navigation/appContext/appContext";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { completeChart } from "../../chart/MyChart/myChartFixtures";
import { fetchMyChart } from "../../chart/skyChart/skyChart";
import { askQuestion, fetchQuestionQuota } from "../../discovery/questionQuota/questionQuota";
import ChatScreen from "./ChatScreen";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));
vi.mock("../../discovery/questionQuota/questionQuota", () => ({
  askQuestion: vi.fn(),
  fetchQuestionQuota: vi.fn(),
}));
vi.mock("../../chart/natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn().mockResolvedValue(null),
}));
vi.mock("../../chart/skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

function renderScreen(isAnonymous = true) {
  const QueryWrapper = createQueryWrapper();
  const context = { isAnonymous } as unknown as AppContextValue;
  render(
    <QueryWrapper>
      <MemoryRouter>
        <AppContext.Provider value={context}>
          <ChatScreen />
          <LocationProbe />
        </AppContext.Provider>
      </MemoryRouter>
    </QueryWrapper>,
  );
}

function LocationProbe() {
  return <p id="location-probe">{useLocation().pathname}</p>;
}

async function askTwice() {
  vi.mocked(askQuestion)
    .mockResolvedValueOnce({ answer: "Première réponse", quota: { limit: 2, used: 1, remaining: 1 }, error: null })
    .mockResolvedValueOnce({ answer: "Seconde réponse", quota: { limit: 2, used: 2, remaining: 0 }, error: null });
  await userEvent.type(screen.getByLabelText("Votre question"), "Une{Enter}");
  expect(await screen.findByText("Première réponse")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Votre question"), "Deux{Enter}");
  expect(await screen.findByText("Seconde réponse")).toBeInTheDocument();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchMyChart).mockResolvedValue({ data: completeChart, error: null });
  vi.mocked(fetchQuestionQuota).mockResolvedValue({ quota: { limit: 2, used: 0, remaining: 2 }, error: null });
});

describe("ChatScreen", () => {
  it("envoie une question au clavier et affiche la réponse", async () => {
    vi.mocked(askQuestion).mockResolvedValue({
      answer: "Réponse de Numa",
      quota: { limit: 2, used: 1, remaining: 1 },
      error: null,
    });
    renderScreen();

    await userEvent.type(screen.getByLabelText("Votre question"), "Bonjour{Enter}");

    expect(await screen.findByText("Réponse de Numa")).toBeInTheDocument();
    expect(askQuestion).toHaveBeenCalledWith("Bonjour");
    expect(await screen.findByText("1 question gratuite restante")).toBeInTheDocument();
  });

  it("restaure la saisie et affiche l'erreur quand le quota est dépassé", async () => {
    vi.mocked(askQuestion).mockResolvedValue({
      answer: null,
      quota: null,
      error: { code: "question_quota_exceeded" },
    });
    renderScreen();

    await userEvent.type(screen.getByLabelText("Votre question"), "Bonjour{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Vous avez utilisé vos questions gratuites");
    expect(screen.getByLabelText("Votre question")).toHaveValue("Bonjour");
  });

  it("propose l'inscription après la deuxième réponse et le refus conserve la conversation", async () => {
    renderScreen();
    await askTwice();

    expect(await screen.findByRole("dialog", { name: "Gardez vos lectures avec vous" })).toBeInTheDocument();
    await userEvent.click(screen.getByText("Continuer sans compte"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Seconde réponse")).toBeInTheDocument();
  });

  it("navigue vers l'inscription ou la connexion", async () => {
    renderScreen();
    await askTwice();

    await userEvent.click(await screen.findByRole("button", { name: "Se connecter" }));

    expect(document.getElementById("location-probe")).toHaveTextContent("/connexion");
  });

  it("ne propose pas l'inscription à un utilisateur connecté", async () => {
    renderScreen(false);
    await askTwice();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
