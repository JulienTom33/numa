import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DiscoveryConsultGate from "./DiscoveryConsultGate";

vi.mock("../useQuestionQuota/useQuestionQuota", () => ({
  useQuestionQuota: () => ({ quota: { limit: 2, used: 2, remaining: 0 } }),
}));

afterEach(() => window.localStorage.clear());

describe("DiscoveryConsultGate", () => {
  it("lit le quota via le hook serveur", () => {
    render(<DiscoveryConsultGate onSignUp={vi.fn()} onSignIn={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
