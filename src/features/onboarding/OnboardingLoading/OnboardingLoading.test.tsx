import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OnboardingLoading from "./OnboardingLoading";

describe("OnboardingLoading", () => {
  it("expose un statut de chargement occupé", () => {
    render(<OnboardingLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("id", "onboarding-flow__status--loading");
  });
});
