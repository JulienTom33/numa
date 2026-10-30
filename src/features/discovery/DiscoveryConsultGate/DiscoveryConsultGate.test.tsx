import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DiscoveryConsultGate from "./DiscoveryConsultGate";

vi.mock("../useQuestionQuota/useQuestionQuota", () => ({
  useQuestionQuota: () => ({ quota: { limit: 4, used: 4, remaining: 0 } }),
}));

describe("DiscoveryConsultGate", () => {
  it("lit le quota via le hook serveur", () => {
    render(<DiscoveryConsultGate onSignUp={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Créer un compte pour continuer" })).toBeInTheDocument();
  });
});
