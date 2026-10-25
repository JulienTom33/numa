import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlaceStep, {
  type PlaceSearch,
  type PlaceSuggestion,
  type SelectedPlace,
  SEARCH_DEBOUNCE_MS,
} from "./PlaceStep";
import { PlaceSearchFailure } from "../placeSearchAdapter/placeSearchAdapter";

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

const bologna: PlaceSuggestion = {
  id: "bologna-it",
  name: "Bologne",
  region: null,
  country: "Italie",
  countryCode: "IT",
  label: "Bologne, Italie",
  latitude: 44.49,
  longitude: 11.34,
  timezone: "Europe/Rome",
};

interface HarnessProps {
  search: PlaceSearch;
  initial?: SelectedPlace | null;
  onChange?: (place: SelectedPlace | null) => void;
}

function Harness({ search, initial = null, onChange = vi.fn() }: HarnessProps) {
  const [value, setValue] = useState<SelectedPlace | null>(initial);
  return (
    <PlaceStep
      id="place-step"
      search={search}
      value={value}
      onChange={(place) => {
        onChange(place);
        setValue(place);
      }}
    />
  );
}

function setup(props: HarnessProps) {
  const user = userEvent.setup({ delay: null });
  render(<Harness {...props} />);
  return { user, input: screen.getByRole("combobox", { name: "Ville de naissance" }) };
}

async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
  });
}

describe("PlaceStep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("jest", { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not search below two characters", async () => {
    const search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux]);
    const { user, input } = setup({ search });

    await user.type(input, "B");
    await flushDebounce();

    expect(search).not.toHaveBeenCalled();
  });

  it("debounces the search and shows suggestions", async () => {
    const search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux, bologna]);
    const { user, input } = setup({ search });

    await user.type(input, "Bor");
    expect(screen.getByRole("status")).toHaveTextContent("Recherche…");
    expect(search).not.toHaveBeenCalled();

    await flushDebounce();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("Bor", expect.any(AbortSignal));
    expect(screen.getByRole("option", { name: /Bordeaux/ })).toHaveTextContent(
      "Gironde, France",
    );
    expect(screen.getByRole("option", { name: /Bologne/ })).toHaveTextContent("Italie");
  });

  it("shows an explicit no-result state", async () => {
    const search = vi.fn<PlaceSearch>().mockResolvedValue([]);
    const { user, input } = setup({ search });

    await user.type(input, "Zzz");
    await flushDebounce();

    expect(screen.getByRole("status")).toHaveTextContent("Aucune ville trouvée");
  });

  it("shows a network error and retries", async () => {
    const search = vi
      .fn<PlaceSearch>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([bordeaux]);
    const { user, input } = setup({ search });

    await user.type(input, "Bor");
    await flushDebounce();

    expect(input).toHaveAccessibleDescription("La recherche a échoué. Vérifiez votre connexion.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(input).toHaveFocus();
    await flushDebounce();

    expect(search).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("option", { name: /Bordeaux/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réessayer" })).not.toBeInTheDocument();
  });

  it.each([
    ["service_unavailable", "Le service de recherche de villes est momentanément indisponible. Réessayez dans un instant."],
    ["provider_unavailable", "Le service de recherche de villes est momentanément indisponible. Réessayez dans un instant."],
    ["rate_limited", "Trop de recherches en peu de temps. Patientez quelques secondes puis réessayez."],
    ["network_error", "La recherche a échoué. Vérifiez votre connexion."],
  ] as const)("describes a %s failure without blaming the connection", async (code, message) => {
    const search = vi.fn<PlaceSearch>().mockRejectedValue(new PlaceSearchFailure(code));
    const { user, input } = setup({ search });

    await user.type(input, "Bor");
    await flushDebounce();

    expect(input).toHaveAccessibleDescription(message);
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });

  it("selects a city and shows its detected timezone", async () => {
    const onChange = vi.fn();
    const search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux]);
    const { user, input } = setup({ search, onChange });

    await user.type(input, "Bor");
    await flushDebounce();
    await user.click(screen.getByRole("option", { name: /Bordeaux/ }));

    expect(onChange).toHaveBeenLastCalledWith(bordeaux);
    expect(input).toHaveValue("Bordeaux, Gironde, France");
    expect(screen.getByText("Bordeaux, Gironde, France")).toBeInTheDocument();
    expect(screen.getByText("Fuseau horaire détecté : Europe/Paris")).toBeInTheDocument();
  });

  it("selects a city with the keyboard", async () => {
    const onChange = vi.fn();
    const search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux, bologna]);
    const { user, input } = setup({ search, onChange });

    await user.type(input, "Bo");
    await flushDebounce();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(input).toHaveAttribute("aria-activedescendant", "place-step-city-option-bologna-it");

    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith(bologna);
    expect(screen.getByText("Fuseau horaire détecté : Europe/Rome")).toBeInTheDocument();
  });

  it("clears the selection when the input is edited", async () => {
    const onChange = vi.fn();
    const search = vi.fn<PlaceSearch>().mockResolvedValue([bordeaux]);
    const { user, input } = setup({ search, onChange, initial: bordeaux });

    expect(input).toHaveValue("Bordeaux, Gironde, France");
    expect(screen.getByText(/Fuseau horaire détecté/)).toBeInTheDocument();

    await user.type(input, "x");

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByText(/Fuseau horaire détecté/)).not.toBeInTheDocument();
  });

  it("ignores a stale response that arrives after a newer query", async () => {
    let resolveFirst: (places: PlaceSuggestion[]) => void = () => undefined;
    const search = vi
      .fn<PlaceSearch>()
      .mockImplementationOnce(
        () =>
          new Promise<PlaceSuggestion[]>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue([bologna]);
    const { user, input } = setup({ search });

    await user.type(input, "Bo");
    await flushDebounce();
    const firstSignal = search.mock.calls[0][1];

    await user.type(input, "l");
    expect(firstSignal.aborted).toBe(true);
    await flushDebounce();

    await act(async () => {
      resolveFirst([bordeaux]);
    });

    expect(screen.getByRole("option", { name: /Bologne/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Bordeaux/ })).not.toBeInTheDocument();
  });

  it("ignores a stale failure once a newer query is pending", async () => {
    let rejectFirst: (reason: Error) => void = () => undefined;
    const search = vi
      .fn<PlaceSearch>()
      .mockImplementationOnce(
        () =>
          new Promise<PlaceSuggestion[]>((_, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValue([bologna]);
    const { user, input } = setup({ search });

    await user.type(input, "Bo");
    await flushDebounce();
    await user.type(input, "l");

    await act(async () => {
      rejectFirst(new Error("aborted"));
    });

    expect(screen.queryByRole("button", { name: "Réessayer" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Recherche…");
  });
});
