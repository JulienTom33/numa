import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MigrationScreen from "./MigrationScreen";

describe("MigrationScreen", () => {
  it("liste les éléments conservés et confirme l'accès", () => {
    const onContinue = vi.fn();
    render(<MigrationScreen onContinue={onContinue} />);

    expect(screen.getByRole("heading", { name: "Votre espace est prêt" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Accéder à mon espace" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
