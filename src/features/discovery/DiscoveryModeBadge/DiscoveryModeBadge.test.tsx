import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiscoveryModeBadge from "./DiscoveryModeBadge";

describe("DiscoveryModeBadge", () => {
  it("renders the discovery mode label", () => {
    render(<DiscoveryModeBadge />);
    expect(screen.getByText("Mode découverte")).toBeInTheDocument();
  });
});
