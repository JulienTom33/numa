import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    render(<ChatScreen />, { wrapper: createQueryWrapper() });

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
    render(<ChatScreen />, { wrapper: createQueryWrapper() });

    await userEvent.type(screen.getByLabelText("Votre question"), "Bonjour{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Vous avez utilisé vos questions gratuites");
    expect(screen.getByLabelText("Votre question")).toHaveValue("Bonjour");
  });
});
