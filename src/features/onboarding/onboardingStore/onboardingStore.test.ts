import { afterEach, describe, expect, it, vi } from "vitest";
import type { OnboardingData } from "../birthData/birthData";
import {
  completeOnboarding,
  draftToRow,
  loadOnboardingDraft,
  rowToDraft,
  saveOnboardingDraft,
  type OnboardingDraftRow,
} from "./onboardingStore";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const USER_ID = "user-1";

const DATA: OnboardingData = {
  firstName: " Émile ",
  birthDate: "1990-03-12",
  birthTime: { precision: "approximate", time: "14:30", margin: "under_30_min" },
  birthPlace: { label: "Lyon, France", latitude: 45.764043, longitude: 4.835659, timezone: "Europe/Paris" },
};

const ROW: OnboardingDraftRow = {
  user_id: USER_ID,
  current_step: 4,
  first_name: "Émile",
  birth_date: "1990-03-12",
  birth_time: "14:30",
  time_precision: "approximate",
  time_margin: "under_30_min",
  birth_place: "Lyon, France",
  latitude: 45.764043,
  longitude: 4.835659,
  timezone: "Europe/Paris",
  ascendant_source: null,
  declared_ascendant_sign: null,
};

function mockSelect(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  vi.mocked(supabase.from).mockReturnValue({ select } as never);
  return { select, eq };
}

describe("draftToRow", () => {
  it("maps the domain draft to the table row", () => {
    expect(draftToRow(USER_ID, { step: 4, data: DATA })).toEqual(ROW);
  });

  it("stores no time nor margin for an unknown time and null for missing fields", () => {
    expect(
      draftToRow(USER_ID, {
        step: 1,
        data: {
          firstName: "  ",
          birthDate: null,
          birthTime: { precision: "unknown", time: "10:00", margin: "over_2_h" },
          birthPlace: null,
        },
      }),
    ).toEqual({
      user_id: USER_ID,
      current_step: 1,
      first_name: null,
      birth_date: null,
      birth_time: null,
      time_precision: "unknown",
      time_margin: null,
      birth_place: null,
      latitude: null,
      longitude: null,
      timezone: null,
      ascendant_source: null,
      declared_ascendant_sign: null,
    });
  });

  it("stores a declared ascendant with its sign", () => {
    const row = draftToRow(USER_ID, { step: 6, data: DATA, ascendant: { source: "declared", declaredSign: "leo" } });

    expect(row).toMatchObject({ current_step: 6, ascendant_source: "declared", declared_ascendant_sign: "leo" });
  });

  it("drops the sign when the computed ascendant is retained", () => {
    const row = draftToRow(USER_ID, { step: 6, data: DATA, ascendant: { source: "computed", declaredSign: "leo" } });

    expect(row).toMatchObject({ ascendant_source: "computed", declared_ascendant_sign: null });
  });

  it("never stores a declared source without sign", () => {
    const row = draftToRow(USER_ID, { step: 6, data: DATA, ascendant: { source: "declared", declaredSign: null } });

    expect(row).toMatchObject({ ascendant_source: null, declared_ascendant_sign: null });
  });
});

describe("rowToDraft", () => {
  it("maps a Postgres row back to the domain, trimming seconds and parsing numerics", () => {
    expect(
      rowToDraft({ ...ROW, birth_time: "14:30:00", latitude: "45.764043", longitude: "4.835659" }),
    ).toEqual({
      step: 4,
      data: { ...DATA, firstName: "Émile" },
      ascendant: { source: null, declaredSign: null },
    });
  });

  it("ignores unexpected enum values, a partial place and clamps the step", () => {
    expect(
      rowToDraft({
        ...ROW,
        current_step: 9,
        first_name: null,
        birth_time: null,
        time_precision: "vague",
        time_margin: "forever",
        timezone: null,
      }),
    ).toEqual({
      step: 6,
      ascendant: { source: null, declaredSign: null },
      data: {
        firstName: "",
        birthDate: "1990-03-12",
        birthTime: { precision: null, time: "", margin: null },
        birthPlace: null,
      },
    });
  });
});

describe("rowToDraft ascendant", () => {
  it("restores the declared ascendant", () => {
    const draft = rowToDraft({ ...ROW, current_step: 6, ascendant_source: "declared", declared_ascendant_sign: "virgo" });

    expect(draft.ascendant).toEqual({ source: "declared", declaredSign: "virgo" });
  });

  it("ignores an unknown sign or source", () => {
    const draft = rowToDraft({ ...ROW, ascendant_source: "guess", declared_ascendant_sign: "ophiuchus" });

    expect(draft.ascendant).toEqual({ source: null, declaredSign: null });
  });
});

describe("loadOnboardingDraft", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the draft of the given user", async () => {
    const { eq } = mockSelect({ data: { ...ROW, birth_data_id: "bd-1" }, error: null });

    const result = await loadOnboardingDraft(USER_ID);

    expect(supabase.from).toHaveBeenCalledWith("onboarding_drafts");
    expect(eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(result).toEqual({ draft: rowToDraft(ROW), birthDataId: "bd-1", error: null });
  });

  it("returns no draft when none exists", async () => {
    mockSelect({ data: null, error: null });

    expect(await loadOnboardingDraft(USER_ID)).toEqual({ draft: null, birthDataId: null, error: null });
  });

  it("returns the load_failed code without technical details", async () => {
    mockSelect({ data: null, error: { message: "relation does not exist" } });

    expect(await loadOnboardingDraft(USER_ID)).toEqual({ draft: null, birthDataId: null, error: "load_failed" });
  });
});

describe("saveOnboardingDraft", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the row on user_id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const { error } = await saveOnboardingDraft(USER_ID, { step: 4, data: DATA });

    expect(error).toBeNull();
    expect(upsert).toHaveBeenCalledWith(ROW, { onConflict: "user_id" });
  });

  it("returns the save_failed code on failure", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "violates row-level security" } });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    expect(await saveOnboardingDraft(USER_ID, { step: 4, data: DATA })).toEqual({ error: "save_failed" });
  });
});

describe("completeOnboarding", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the birth_data id produced by the rpc", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: "bd-1", error: null } as never);

    expect(await completeOnboarding()).toEqual({ birthDataId: "bd-1", error: null });
    expect(supabase.rpc).toHaveBeenCalledWith("complete_onboarding");
  });

  it("returns the save_failed code when the rpc fails", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: "onboarding_incomplete" } } as never);

    expect(await completeOnboarding()).toEqual({ birthDataId: null, error: "save_failed" });
  });
});
