import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { supabase } from "./lib/supabaseClient";

vi.mock("./lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

function mockAnonymousSession() {
  vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
    data: { session: { user: { id: "user-1", is_anonymous: true } } },
  } as never);
}

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Numa" })).toBeInTheDocument();
  });

  it("renders the discover button without tab bar when no session is persisted", async () => {
    render(<App />);
    expect(await screen.findByRole("button", { name: "Découvrir sans compte" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navigation principale" })).not.toBeInTheDocument();
  });

  it("shows the discovery mode badge for an anonymous session", async () => {
    mockAnonymousSession();

    render(<App />);

    expect(await screen.findByText("Mode découverte")).toBeInTheDocument();
  });

  it("shows the tab bar with Today active once a session exists", async () => {
    mockAnonymousSession();

    render(<App />);

    expect(await screen.findByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Aujourd'hui" })).toBeInTheDocument();
  });

  it("switches screen and scrolls back to the top when a tab is selected", async () => {
    mockAnonymousSession();
    render(<App />);
    await screen.findByRole("navigation", { name: "Navigation principale" });
    const content = screen.getByRole("main");
    content.scrollTop = 300;

    await userEvent.click(screen.getByRole("button", { name: "Mon thème" }));

    expect(screen.getByRole("heading", { name: "Mon thème" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mon thème" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Aujourd'hui" })).not.toHaveAttribute("aria-current");
    expect(content.scrollTop).toBe(0);
  });
});
