import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import NameStep from "./NameStep";

function ControlledNameStep({ onContinue }: { onContinue: () => void }) {
  const [value, setValue] = useState("");
  return <NameStep value={value} onChange={setValue} onContinue={onContinue} onBack={vi.fn()} />;
}

describe("NameStep", () => {
  it("renders step 1 with a labelled name field", () => {
    render(<NameStep value="" onChange={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText("Étape 1 sur 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Comment devons-nous vous appeler ?" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom ou pseudonyme")).toHaveAttribute(
      "id",
      "name-step__input--name",
    );
  });

  it("keeps Continue disabled while the name is empty or blank", () => {
    render(<NameStep value="   " onChange={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
  });

  it("enables Continue once a name is typed", async () => {
    const onContinue = vi.fn();
    render(<ControlledNameStep onContinue={onContinue} />);

    await userEvent.type(screen.getByLabelText("Prénom ou pseudonyme"), "Léa");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows the discovery badge in discovery mode", () => {
    render(
      <NameStep value="" onChange={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} discoveryMode />,
    );

    expect(screen.getByText("Mode découverte")).toBeInTheDocument();
  });
});
