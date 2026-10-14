import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DiscoverButton from "./DiscoverButton";

describe("DiscoverButton", () => {
  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<DiscoverButton onClick={onClick} loading={false} error={null} />);

    await userEvent.click(screen.getByRole("button", { name: "Découvrir sans compte" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables the button and shows a loading label while loading", () => {
    render(<DiscoverButton onClick={vi.fn()} loading={true} error={null} />);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Création de la session…")).toBeInTheDocument();
  });

  it("shows the error message when present", () => {
    render(<DiscoverButton onClick={vi.fn()} loading={false} error="réseau indisponible" />);

    expect(screen.getByRole("alert")).toHaveTextContent("réseau indisponible");
  });
});
