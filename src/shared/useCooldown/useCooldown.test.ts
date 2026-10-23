import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCooldown } from "./useCooldown";

describe("useCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idle by default", () => {
    const { result } = renderHook(() => useCooldown());

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isCoolingDown).toBe(false);
  });

  it("counts down one second at a time until it ends", () => {
    const { result } = renderHook(() => useCooldown());

    act(() => result.current.start(3));
    expect(result.current.remainingSeconds).toBe(3);
    expect(result.current.isCoolingDown).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingSeconds).toBe(2);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isCoolingDown).toBe(false);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("ignores negative durations and rounds fractions up", () => {
    const { result } = renderHook(() => useCooldown());

    act(() => result.current.start(-5));
    expect(result.current.remainingSeconds).toBe(0);

    act(() => result.current.start(1.2));
    expect(result.current.remainingSeconds).toBe(2);
  });

  it("can start already cooling down", () => {
    const { result } = renderHook(() => useCooldown(2));

    expect(result.current.remainingSeconds).toBe(2);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.isCoolingDown).toBe(false);
  });
});
