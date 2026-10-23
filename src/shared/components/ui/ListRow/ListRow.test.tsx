import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ListRow from "./ListRow";

describe("ListRow", () => {
  it("renders a button named after its label and value", () => {
    render(<ListRow id="test__row--language" label="Langue" value="Français" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Langue Français" })).toHaveAttribute(
      "id",
      "test__row--language",
    );
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<ListRow id="test__row--info" label="Mes informations" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Mes informations" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a chevron by default", () => {
    const { container } = render(
      <ListRow id="test__row--info" label="Mes informations" onClick={vi.fn()} />,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("uses the danger tone without chevron", () => {
    const { container } = render(
      <ListRow
        id="test__row--delete"
        label="Supprimer mes données"
        tone="danger"
        icon="trash"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button")).toHaveClass("text-coral-ink");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });
});
