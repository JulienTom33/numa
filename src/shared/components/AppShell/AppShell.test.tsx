import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders its content inside the main landmark", () => {
    render(
      <AppShell id="test__shell--main" screenKey="today">
        <p>Contenu</p>
      </AppShell>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Contenu");
    expect(screen.getByRole("main")).toHaveAttribute("id", "test__shell--main-content");
  });

  it("uses the wide shell container on desktop", () => {
    render(
      <AppShell id="test__shell--main" screenKey="today">
        <p>Contenu</p>
      </AppShell>,
    );

    expect(screen.getByRole("main").parentElement).toHaveClass("max-w-shell");
  });

  it("renders the tab bar when provided", () => {
    render(
      <AppShell id="test__shell--main" screenKey="today" tabBar={<nav aria-label="Onglets" />}>
        <p>Contenu</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Onglets" })).toBeInTheDocument();
  });

  it("scrolls back to the top when the screen changes", () => {
    const { rerender } = render(
      <AppShell id="test__shell--main" screenKey="today">
        <p>Contenu</p>
      </AppShell>,
    );
    const content = screen.getByRole("main");
    content.scrollTop = 240;

    rerender(
      <AppShell id="test__shell--main" screenKey="profile">
        <p>Contenu</p>
      </AppShell>,
    );

    expect(content.scrollTop).toBe(0);
  });

  it("keeps the scroll position while the screen stays the same", () => {
    const { rerender } = render(
      <AppShell id="test__shell--main" screenKey="today">
        <p>Contenu</p>
      </AppShell>,
    );
    const content = screen.getByRole("main");
    content.scrollTop = 240;

    rerender(
      <AppShell id="test__shell--main" screenKey="today">
        <p>Autre contenu</p>
      </AppShell>,
    );

    expect(content.scrollTop).toBe(240);
  });
});
