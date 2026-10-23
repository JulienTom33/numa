import { describe, expect, it } from "vitest";
import { isTimeStepComplete, withPrecision } from "./timeStepValue";

describe("isTimeStepComplete", () => {
  it("is incomplete while no precision is chosen", () => {
    expect(isTimeStepComplete({ precision: null })).toBe(false);
  });

  it("requires a valid time for an exact time", () => {
    expect(isTimeStepComplete({ precision: "exact" })).toBe(false);
    expect(isTimeStepComplete({ precision: "exact", time: "25:00" })).toBe(false);
    expect(isTimeStepComplete({ precision: "exact", time: "08:45" })).toBe(true);
  });

  it("requires a time and a margin for an approximate time", () => {
    expect(isTimeStepComplete({ precision: "approximate", time: "08:45" })).toBe(false);
    expect(isTimeStepComplete({ precision: "approximate", margin: "over_2_h" })).toBe(false);
    expect(
      isTimeStepComplete({ precision: "approximate", time: "08:45", margin: "over_2_h" }),
    ).toBe(true);
  });

  it("is complete as soon as the time is declared unknown", () => {
    expect(isTimeStepComplete({ precision: "unknown" })).toBe(true);
  });
});

describe("withPrecision", () => {
  it("keeps the time when switching from approximate to exact, but drops the margin", () => {
    expect(
      withPrecision({ precision: "approximate", time: "08:45", margin: "under_30_min" }, "exact"),
    ).toEqual({ precision: "exact", time: "08:45" });
  });

  it("keeps time and margin when switching back to approximate", () => {
    expect(
      withPrecision({ precision: "exact", time: "08:45", margin: "under_30_min" }, "approximate"),
    ).toEqual({ precision: "approximate", time: "08:45", margin: "under_30_min" });
  });

  it("clears time and margin when the time becomes unknown", () => {
    expect(
      withPrecision({ precision: "approximate", time: "08:45", margin: "over_2_h" }, "unknown"),
    ).toEqual({ precision: "unknown" });
  });

  it("starts without a time when none was entered", () => {
    expect(withPrecision({ precision: null }, "exact")).toEqual({ precision: "exact" });
  });
});
