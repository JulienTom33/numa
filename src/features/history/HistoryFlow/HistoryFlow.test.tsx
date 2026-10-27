import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppContext, type AppContextValue } from "../../../shared/navigation/appContext/appContext";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchConversationDetail, fetchConversations } from "../historyService/historyService";
import HistoryFlow from "./HistoryFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));
vi.mock("../historyService/historyService", () => ({ fetchConversations: vi.fn(), fetchConversationDetail: vi.fn() }));

const session = { user: { id: "user-1" } } as unknown as Session;

function renderFlow() {
  const Wrapper = createQueryWrapper();
  const context = { session } as unknown as AppContextValue;
  render(
    <Wrapper>
      <AppContext.Provider value={context}>
        <HistoryFlow />
      </AppContext.Provider>
    </Wrapper>,
  );
}

describe("HistoryFlow", () => {
  beforeEach(() => {
    vi.mocked(fetchConversations).mockReset();
    vi.mocked(fetchConversationDetail).mockReset();
  });

  it("affiche l'état vide", async () => {
    vi.mocked(fetchConversations).mockResolvedValue({ data: [], error: null });
    renderFlow();
    expect(await screen.findByText("Aucune conversation pour l'instant")).toBeInTheDocument();
    expect(fetchConversations).toHaveBeenCalledWith("user-1");
  });

  it("affiche l'erreur de chargement et recharge au nouvel essai", async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce({ data: null, error: "network_error" });
    renderFlow();
    expect(await screen.findByText(/Impossible de charger/)).toBeInTheDocument();

    vi.mocked(fetchConversations).mockResolvedValueOnce({ data: [], error: null });
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText("Aucune conversation pour l'instant")).toBeInTheDocument();
  });

  it("ouvre une conversation puis revient à la liste", async () => {
    vi.mocked(fetchConversations).mockResolvedValue({
      data: [{ id: "c1", title: "Ma question", updatedAt: "2026-10-20T10:00:00Z" }],
      error: null,
    });
    vi.mocked(fetchConversationDetail).mockResolvedValue({
      data: {
        conversation: { id: "c1", title: "Ma question", updatedAt: "2026-10-20T10:00:00Z" },
        messages: [{ id: "m1", author: "user", text: "Bonjour", createdAt: "2026-10-20T10:00:00Z" }],
      },
      error: null,
    });
    renderFlow();
    await userEvent.click(await screen.findByRole("button", { name: /Ma question/ }));
    expect(await screen.findByText("Bonjour")).toBeInTheDocument();
    expect(fetchConversationDetail).toHaveBeenCalledWith("user-1", "c1");

    await userEvent.click(screen.getByRole("button", { name: "Retour aux conversations" }));
    expect(await screen.findByRole("heading", { name: "Mes conversations" })).toBeInTheDocument();
  });
});
