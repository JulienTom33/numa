import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar";

describe("TopBar", () => {
  it("renders a header with its title", () => {
    render(<TopBar id="test__topbar--main" title="Horoscope du jour" />);

    expect(screen.getByRole("banner")).toHaveAttribute("id", "test__topbar--main");
    expect(screen.getByRole("heading", { name: "Horoscope du jour" })).toBeInTheDocument();
  });

  it("renders no back button without onBack", () => {
    render(<TopBar id="test__topbar--main" title="Titre" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onBack from the back button", async () => {
    const onBack = vi.fn();
    render(<TopBar id="test__topbar--main" onBack={onBack} backLabel="Retour à l'accueil" />);

    await userEvent.click(screen.getByRole("button", { name: "Retour à l'accueil" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders leading and trailing slots without a title", () => {
    render(
      <TopBar
        id="test__topbar--main"
        leading={<span>Mode découverte</span>}
        trailing={<span>Avatar</span>}
      />,
    );

    expect(screen.getByText("Mode découverte")).toBeInTheDocument();
    expect(screen.getByText("Avatar")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
