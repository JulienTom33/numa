import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import InfoTooltip from "./InfoTooltip";

function renderTooltip() {
  render(
    <div>
      <InfoTooltip id="test__tooltip--zodiac" label="En savoir plus sur le zodiaque tropical">
        Le zodiaque tropical se base sur les saisons.
      </InfoTooltip>
      <p>Ailleurs</p>
    </div>,
  );
  return screen.getByRole("button", { name: "En savoir plus sur le zodiaque tropical" });
}

describe("InfoTooltip", () => {
  it("is closed by default", () => {
    const trigger = renderTooltip();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/saisons/)).not.toBeInTheDocument();
  });

  it("opens and closes on click", async () => {
    const trigger = renderTooltip();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/saisons/)).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.queryByText(/saisons/)).not.toBeInTheDocument();
  });

  it("opens with the keyboard and closes with Escape", async () => {
    const trigger = renderTooltip();

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText(/saisons/)).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText(/saisons/)).not.toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const trigger = renderTooltip();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText("Ailleurs"));

    expect(screen.queryByText(/saisons/)).not.toBeInTheDocument();
  });

  it("stays open when clicking inside its content", async () => {
    const trigger = renderTooltip();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText(/saisons/));

    expect(screen.getByText(/saisons/)).toBeInTheDocument();
  });
});
