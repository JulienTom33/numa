import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TabBar, { type TabBarItem } from "./TabBar";

type Tab = "today" | "consult" | "theme" | "profile";

const items: TabBarItem<Tab>[] = [
  { key: "today", label: "Aujourd'hui", icon: "today" },
  { key: "consult", label: "Consulter", icon: "consult" },
  { key: "theme", label: "Mon thème", icon: "theme" },
  { key: "profile", label: "Profil", icon: "profile" },
];

describe("TabBar", () => {
  it("renders a labelled navigation with all tabs", () => {
    render(<TabBar id="test__tabbar--main" items={items} activeKey="today" onSelect={vi.fn()} />);

    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("marks only the active tab as current page", () => {
    render(<TabBar id="test__tabbar--main" items={items} activeKey="theme" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Mon thème" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Profil" })).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect with the tab key", async () => {
    const onSelect = vi.fn();
    render(<TabBar id="test__tabbar--main" items={items} activeKey="today" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Consulter" }));

    expect(onSelect).toHaveBeenCalledWith("consult");
  });

  it("derives tab ids from its own id", () => {
    render(<TabBar id="test__tabbar--main" items={items} activeKey="today" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Profil" })).toHaveAttribute(
      "id",
      "test__tabbar--main-profile",
    );
  });
});
