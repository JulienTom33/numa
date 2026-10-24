import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import type { AscendantChoice } from "../../chart/ascendant/ascendant";
import type { BirthPlace, OnboardingData } from "../birthData/birthData";
import { completeOnboarding, loadOnboardingDraft, saveOnboardingDraft } from "../onboardingStore/onboardingStore";
import { fetchComputedAscendant } from "../../chart/natalChart/natalChart";
import { streamNatalChart } from "../../chart/natalChartProgress/natalChartProgress";
import { readFirstName } from "../../chart/natalChartSummary/natalChartSummary";
import { fetchMyChart } from "../../chart/skyChart/skyChart";
import { completeChart } from "../../chart/MyChart/myChartFixtures";
import { completeSummary } from "../../chart/ChartSummary/chartSummaryFixtures";
import type { PlaceSuggestion } from "../placeSearch/placeSearch";
import type { PlaceSearch } from "../placeSearchAdapter/placeSearchAdapter";
import OnboardingFlow from "./OnboardingFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../chart/natalChart/natalChart", () => ({ fetchComputedAscendant: vi.fn() }));

vi.mock("../../chart/natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn(),
}));

vi.mock("../../chart/skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

vi.mock("../../chart/natalChartProgress/natalChartProgress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/natalChartProgress/natalChartProgress")>()),
  streamNatalChart: vi.fn(),
}));

vi.mock("../onboardingStore/onboardingStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../onboardingStore/onboardingStore")>()),
  loadOnboardingDraft: vi.fn(),
  saveOnboardingDraft: vi.fn(),
  completeOnboarding: vi.fn(),
}));

const TODAY = new Date(2026, 9, 15, 12, 0);

const bordeaux: PlaceSuggestion = {
  id: "bordeaux-fr",
  name: "Bordeaux",
  region: "Gironde",
  country: "France",
  countryCode: "FR",
  label: "Bordeaux, Gironde, France",
  latitude: 44.84,
  longitude: -0.58,
  timezone: "Europe/Paris",
};

const LYON: BirthPlace = { label: "Lyon, France", latitude: 45.76, longitude: 4.83, timezone: "Europe/Paris" };

const COMPLETE_DATA: OnboardingData = {
  firstName: "Émile",
  birthDate: "1990-03-12",
  birthTime: { precision: "approximate", time: "08:45", margin: "under_30_min" },
  birthPlace: LYON,
};

interface RenderOptions {
  discoveryMode?: boolean;
  onExit?: () => void;
  search?: PlaceSearch;
}

function renderFlow({ discoveryMode = false, onExit, search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux]) }: RenderOptions = {}) {
  const onComplete = vi.fn();
  render(
    <OnboardingFlow
      userId="user-1"
      discoveryMode={discoveryMode}
      onComplete={onComplete}
      onExit={onExit}
      search={search}
      today={TODAY}
    />,
    { wrapper: createQueryWrapper() },
  );
  return { onComplete, search };
}

function mockDraft(
  step: 1 | 2 | 3 | 4 | 5 | 6,
  data: OnboardingData,
  birthDataId: string | null = null,
  ascendant: AscendantChoice = { source: null, declaredSign: null },
) {
  vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: { step, data, ascendant }, birthDataId, error: null });
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    vi.mocked(streamNatalChart).mockResolvedValue(null);
    vi.mocked(fetchMyChart).mockResolvedValue({ data: completeChart, error: null });
    vi.mocked(readFirstName).mockResolvedValue(completeSummary.firstName);
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });
    vi.mocked(saveOnboardingDraft).mockResolvedValue({ error: null });
    vi.mocked(completeOnboarding).mockResolvedValue({ birthDataId: "bd-1", error: null });
    vi.mocked(fetchComputedAscendant).mockResolvedValue({
      ascendant: { sign: "scorpio", degreeInSign: 14.6 },
      confidence: "high",
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while the draft is loaded", async () => {
    renderFlow();

    expect(screen.getByRole("status")).toHaveTextContent("Chargement de votre parcours…");
    expect(await screen.findByRole("heading", { name: "Comment devons-nous vous appeler ?" })).toBeInTheDocument();
  });

  it("walks through the five steps and ends the journey", async () => {
    const user = userEvent.setup({ delay: null });
    const { onComplete, search } = renderFlow();

    await user.type(await screen.findByLabelText("Prénom ou pseudonyme"), "Émile");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("heading", { name: "Quand êtes-vous né(e) ?" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Jour"), "12");
    await user.selectOptions(screen.getByLabelText("Mois"), "Mars");
    await user.selectOptions(screen.getByLabelText("Année"), "1990");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("heading", { name: "À quelle heure êtes-vous né(e) ?" })).toBeInTheDocument();
    expect(screen.getByText("Étape 3 sur 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /Heure exacte/ }));
    await user.type(screen.getByLabelText("Heure de naissance"), "14:30");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("heading", { name: "Où êtes-vous né(e) ?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
    await user.type(screen.getByRole("combobox", { name: "Ville de naissance" }), "Bor");
    await user.click(await screen.findByRole("option", { name: /Bordeaux/ }));
    expect(search).toHaveBeenCalledWith("Bor", expect.any(AbortSignal));
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("heading", { name: "Vérifiez vos informations" })).toBeInTheDocument();
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
    expect(saveOnboardingDraft).toHaveBeenLastCalledWith("user-1", {
      step: 5,
      ascendant: { source: null, declaredSign: null },
      data: {
        firstName: "Émile",
        birthDate: "1990-03-12",
        birthTime: { precision: "exact", time: "14:30", margin: null },
        birthPlace: bordeaux,
      },
    });
    expect(document.getElementById("summary-step__value--birth-time")).toHaveTextContent("14:30");
    expect(document.getElementById("summary-step__value--birth-place")).toHaveTextContent("Bordeaux, Gironde, France");

    await user.click(screen.getByRole("button", { name: "Valider" }));

    expect(await screen.findByRole("heading", { name: "Votre ascendant" })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(await screen.findByText("Scorpion à 14°")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Voir mon thème" }));

    await user.click(await screen.findByRole("button", { name: "Découvrir mon espace" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(saveOnboardingDraft).toHaveBeenLastCalledWith(
      "user-1",
      expect.objectContaining({ step: 6, ascendant: { source: "computed", declaredSign: null } }),
    );
  }, 15000);

  it("resumes a saved draft and lets the user edit a field from the summary", async () => {
    const user = userEvent.setup({ delay: null });
    mockDraft(5, COMPLETE_DATA, "bd-1");
    renderFlow();

    expect(await screen.findByRole("heading", { name: "Vérifiez vos informations" })).toBeInTheDocument();
    expect(document.getElementById("summary-step__value--first-name")).toHaveTextContent("Émile");
    expect(document.getElementById("summary-step__value--birth-date")).toHaveTextContent("12 mars 1990");
    expect(document.getElementById("summary-step__value--birth-time")).toHaveTextContent("Vers 08:45 (marge < 30 min)");
    expect(screen.getByText(/Votre heure est approximative/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Modifier : Heure de naissance" }));

    expect(screen.getByRole("heading", { name: "À quelle heure êtes-vous né(e) ?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Heure approximative/ })).toBeChecked();
    expect(screen.getByLabelText("Heure approximative")).toHaveValue("08:45");
  });

  it("goes back to the previous step and only offers an exit on the first step", async () => {
    const user = userEvent.setup({ delay: null });
    const onExit = vi.fn();
    mockDraft(2, { ...COMPLETE_DATA, birthDate: null });
    renderFlow({ onExit });

    await screen.findByRole("heading", { name: "Quand êtes-vous né(e) ?" });
    await user.click(screen.getByRole("button", { name: "Retour" }));

    expect(screen.getByRole("heading", { name: "Comment devons-nous vous appeler ?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retour" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("hides the back button on the first step without exit", async () => {
    renderFlow();

    await screen.findByRole("heading", { name: "Comment devons-nous vous appeler ?" });

    expect(screen.queryByRole("button", { name: "Retour" })).not.toBeInTheDocument();
  });

  it("shows the discovery mode badge for an anonymous session", async () => {
    renderFlow({ discoveryMode: true });

    expect(await screen.findByText("Mode découverte")).toBeInTheDocument();
  });

  it("stays on the step and shows the error when saving fails", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(saveOnboardingDraft).mockResolvedValue({ error: "save_failed" });
    renderFlow();

    await user.type(await screen.findByLabelText("Prénom ou pseudonyme"), "Émile");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vos informations n'ont pas pu être enregistrées.");
    expect(screen.getByRole("heading", { name: "Comment devons-nous vous appeler ?" })).toBeInTheDocument();
  });

  it("does not end the journey when the final validation fails", async () => {
    const user = userEvent.setup({ delay: null });
    mockDraft(6, COMPLETE_DATA, "bd-1", { source: "computed", declaredSign: null });
    vi.mocked(completeOnboarding).mockResolvedValue({ birthDataId: null, error: "save_failed" });
    const { onComplete } = renderFlow();

    await user.click(await screen.findByRole("button", { name: "Voir mon thème" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vos informations n'ont pas pu être enregistrées.");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("lets a user who declares a different ascendant choose which version to keep", async () => {
    const user = userEvent.setup({ delay: null });
    mockDraft(6, { ...COMPLETE_DATA, birthTime: { precision: "exact", time: "14:30", margin: null } }, "bd-1");
    const { onComplete } = renderFlow();

    await user.click(await screen.findByRole("button", { name: "Ce n'est pas exact ? Modifier" }));
    await user.click(screen.getByRole("radio", { name: "Oui" }));
    await user.click(screen.getByRole("radio", { name: "Lion" }));

    expect(screen.getByRole("button", { name: "Voir mon thème" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /Garder mon ascendant/ }));
    await user.click(screen.getByRole("button", { name: "Voir mon thème" }));

    await user.click(await screen.findByRole("button", { name: "Découvrir mon espace" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(saveOnboardingDraft).toHaveBeenLastCalledWith(
      "user-1",
      expect.objectContaining({ ascendant: { source: "declared", declaredSign: "leo" } }),
    );
  });

  it("shows the load error and starts from the first step", async () => {
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: "load_failed" });
    renderFlow();

    expect(await screen.findByRole("alert")).toHaveTextContent("Votre saisie précédente n'a pas pu être récupérée.");
    expect(screen.getByText("Étape 1 sur 5")).toBeInTheDocument();
  });
});
