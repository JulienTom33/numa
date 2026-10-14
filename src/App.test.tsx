import { render, screen } from "@testing-library/react";
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

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Numa" })).toBeInTheDocument();
  });

  it("renders the discover button when no session is persisted", async () => {
    render(<App />);
    expect(await screen.findByRole("button", { name: "Découvrir sans compte" })).toBeInTheDocument();
  });

  it("shows the discovery mode badge for an anonymous session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: "user-1", is_anonymous: true } } },
    } as never);

    render(<App />);

    expect(await screen.findByText("Mode découverte")).toBeInTheDocument();
  });
});
