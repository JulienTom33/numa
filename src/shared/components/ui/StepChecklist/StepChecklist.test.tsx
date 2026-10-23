import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StepChecklist from "./StepChecklist";

const steps = [
  { id: "check", label: "Vérification des données" },
  { id: "timezone", label: "Fuseau horaire" },
  { id: "planets", label: "Positions planétaires" },
];

describe("StepChecklist", () => {
  it("renders an ordered list of steps", () => {
    render(<StepChecklist id="test__checklist--chart" steps={steps} completedCount={0} />);

    expect(screen.getByRole("list")).toHaveAttribute("id", "test__checklist--chart");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("announces the status of each step", () => {
    render(<StepChecklist id="test__checklist--chart" steps={steps} completedCount={1} />);
    const items = screen.getAllByRole("listitem");

    expect(items[0]).toHaveTextContent("Vérification des données (terminé)");
    expect(items[1]).toHaveTextContent("Fuseau horaire (en cours)");
    expect(items[2]).toHaveTextContent("Positions planétaires (à venir)");
  });

  it("marks every step done when all are completed", () => {
    render(<StepChecklist id="test__checklist--chart" steps={steps} completedCount={3} />);

    expect(screen.getAllByText(/\(terminé\)/)).toHaveLength(3);
  });
});
