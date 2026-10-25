import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChatSuggestions from "./ChatSuggestions";

describe("ChatSuggestions", () => {
  it("affiche cinq suggestions et renvoie la question choisie", async () => {
    const onSelect = vi.fn();
    render(<ChatSuggestions onSelect={onSelect} />);

    expect(screen.getAllByRole("button")).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: "Comment se présente ma semaine ?" }));
    expect(onSelect).toHaveBeenCalledWith("Comment se présente ma semaine ?");
  });

  it("désactive les suggestions", () => {
    render(<ChatSuggestions onSelect={vi.fn()} disabled />);
    expect(screen.getAllByRole("button")[0]).toBeDisabled();
  });
});
