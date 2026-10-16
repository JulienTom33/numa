import { describe, expect, it } from "vitest";
import { toBirthTimeInput, toTimeStepValue } from "./timeStepAdapter";

describe("timeStepAdapter", () => {
  it("maps an empty hook input to a screen value without optional fields", () => {
    expect(toTimeStepValue({ precision: null, time: "", margin: null })).toEqual({ precision: null });
  });

  it("keeps time and margin when they are set", () => {
    expect(toTimeStepValue({ precision: "approximate", time: "08:45", margin: "over_2_h" })).toEqual({
      precision: "approximate",
      time: "08:45",
      margin: "over_2_h",
    });
  });

  it("maps missing screen fields back to the hook's empty values", () => {
    expect(toBirthTimeInput({ precision: "unknown" })).toEqual({ precision: "unknown", time: "", margin: null });
  });

  it("round-trips a complete value", () => {
    const value = { precision: "exact" as const, time: "14:30" };
    expect(toTimeStepValue(toBirthTimeInput(value))).toEqual(value);
  });
});
