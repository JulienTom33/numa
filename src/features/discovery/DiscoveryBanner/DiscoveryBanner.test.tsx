import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiscoveryBanner from "./DiscoveryBanner";

describe("DiscoveryBanner", () => {
  it("annonce la lecture gratuite restante", () => {
    render(<DiscoveryBanner />);
    expect(screen.getByText("Il vous reste 1 lecture gratuite")).toBeInTheDocument();
  });
});
