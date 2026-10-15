import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IconButton from "./IconButton";

describe("IconButton", () => {
  it("exposes its label as accessible name", () => {
    render(<IconButton id="test__button--close" icon="close" label="Fermer" />);

    expect(screen.getByRole("button", { name: "Fermer" })).toHaveAttribute(
      "id",
      "test__button--close",
    );
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<IconButton id="test__button--back" icon="back" label="Retour" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <IconButton id="test__button--back" icon="back" label="Retour" onClick={onClick} disabled />,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the surface variant", () => {
    render(<IconButton id="test__button--edit" icon="edit" label="Modifier" variant="surface" />);

    expect(screen.getByRole("button")).toHaveClass("border-line");
  });
});
