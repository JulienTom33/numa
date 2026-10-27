import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders its title as heading", () => {
    render(<EmptyState id="test__empty--history" title="Aucune conversation" />);

    expect(screen.getByRole("heading", { name: "Aucune conversation" })).toBeInTheDocument();
  });

  it("renders the optional description and action", () => {
    render(
      <EmptyState
        id="test__empty--history"
        title="Aucune conversation"
        description="Vos échanges avec Sidéra apparaîtront ici."
        action={<button type="button">Poser une question</button>}
      />,
    );

    expect(screen.getByText("Vos échanges avec Sidéra apparaîtront ici.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Poser une question" })).toBeInTheDocument();
  });

  it("omits description and action when not provided", () => {
    render(<EmptyState id="test__empty--history" title="Aucune conversation" icon="history" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
