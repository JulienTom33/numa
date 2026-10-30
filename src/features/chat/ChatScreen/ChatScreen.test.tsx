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

async function askFourTimes() {
  const quota = (used: number) => ({ limit: 4, used, remaining: 4 - used });
  const answers = ["Première", "Deuxième", "Troisième", "Quatrième"];
  answers.forEach((answer, index) => {
    vi.mocked(askQuestion).mockResolvedValueOnce({ answer, basis: null, quota: quota(index + 1), error: null });
  });
  for (const [index, answer] of answers.entries()) {
    await userEvent.type(screen.getByLabelText("Votre question"), "Q" + index + "{Enter}");
    expect(await screen.findByText(answer)).toBeInTheDocument();
    if (index < 3) expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchMyChart).mockResolvedValue({ data: completeChart, error: null });
  vi.mocked(fetchQuestionQuota).mockResolvedValue({ quota: { limit: 4, used: 0, remaining: 4 }, error: null });
});

describe("ChatScreen", () => {
  it("envoie une question au clavier et affiche la réponse", async () => {
    vi.mocked(askQuestion).mockResolvedValue({
      answer: "Réponse de Sidéra",
      basis: null,
      quota: { limit: 4, used: 1, remaining: 3 },
      error: null,
    });
    renderScreen();

    await userEvent.type(screen.getByLabelText("Votre question"), "Bonjour{Enter}");

    expect(await screen.findByText("Réponse de Sidéra")).toBeInTheDocument();
    expect(askQuestion).toHaveBeenCalledWith("Bonjour");
    expect(await screen.findByText("3 questions gratuites restantes")).toBeInTheDocument();
  });

  it("restaure la saisie et affiche l'erreur quand le quota est dépassé", async () => {
    vi.mocked(askQuestion).mockResolvedValue({
      answer: null,
      basis: null,
      quota: null,
      error: { code: "question_quota_exceeded" },
    });
    renderScreen();

    await userEvent.type(screen.getByLabelText("Votre question"), "Bonjour{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Vous avez utilisé vos questions gratuites");
    expect(screen.getByLabelText("Votre question")).toHaveValue("Bonjour");
  });

  it("propose l'inscription après la quatrième réponse et le refus conserve la conversation", async () => {
    renderScreen();
    await askFourTimes();

    expect(await screen.findByRole("dialog", { name: "Gardez vos lectures avec vous" })).toBeInTheDocument();
    await userEvent.click(screen.getByText("Continuer sans compte"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Quatrième")).toBeInTheDocument();
  });

  it("navigue vers l'inscription ou la connexion", async () => {
    renderScreen();
    await askFourTimes();

    await userEvent.click(await screen.findByRole("button", { name: "Se connecter" }));

    expect(document.getElementById("location-probe")).toHaveTextContent("/connexion");
  });

  it("ne propose pas l'inscription à un utilisateur connecté", async () => {
    renderScreen(false);
    await askFourTimes();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
