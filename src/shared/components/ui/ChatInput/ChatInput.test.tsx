import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import ChatInput from "./ChatInput";

function Harness({
  onSubmit,
  disabled = false,
}: {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <ChatInput
      id="test__chat-input--question"
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      disabled={disabled}
    />
  );
}

describe("ChatInput", () => {
  it("renders a labelled input and a send button disabled while empty", () => {
    render(<Harness onSubmit={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Votre question" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  });

  it("keeps the send button disabled for whitespace only", async () => {
    render(<Harness onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByRole("textbox"), "   ");

    expect(screen.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  });

  it("submits the trimmed message with Enter", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole("textbox"), "  Ma semaine ?  {Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Ma semaine ?");
  });

  it("submits with the send button", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole("textbox"), "Ma semaine ?");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(onSubmit).toHaveBeenCalledWith("Ma semaine ?");
  });

  it("does not submit an empty message with Enter", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole("textbox"), "{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables input and button when disabled", () => {
    render(<Harness onSubmit={vi.fn()} disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
