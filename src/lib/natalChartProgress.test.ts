import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "./supabaseClient";
import { streamNatalChart } from "./natalChartProgress";
import type { ChartPhase } from "../../shared/contracts/natalChart/natalChart.ts";

vi.mock("./supabaseClient", () => ({ supabase: { auth: { getSession: vi.fn() } } }));

const getSession = vi.mocked(supabase.auth.getSession);
const fetchMock = vi.fn<typeof fetch>();

function ndjson(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VITE_SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable");
  getSession.mockResolvedValue({ data: { session: { access_token: "jwt" } }, error: null } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("streamNatalChart", () => {
  it("transmet chaque phase à sa réception, y compris quand une ligne est coupée entre deux morceaux", async () => {
    fetchMock.mockResolvedValue(ndjson(['{"phase":"validation"}\n{"pha', 'se":"timezone"}\n{"chart":{}}\n']));
    const phases: ChartPhase[] = [];

    const error = await streamNatalChart((phase) => phases.push(phase));

    expect(error).toBeNull();
    expect(phases).toEqual(["validation", "timezone"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:54321/functions/v1/natal-chart?progress=1",
      expect.objectContaining({ headers: { Authorization: "Bearer jwt", apikey: "publishable" } }),
    );
  });

  it("renvoie le code d'un événement d'erreur du flux", async () => {
    fetchMock.mockResolvedValue(
      ndjson(['{"phase":"validation"}\n', '{"error":{"code":"invalid_birth_data","message":"invalid_birth_data"}}\n']),
    );

    expect(await streamNatalChart(() => undefined)).toBe("invalid_birth_data");
  });

  it("signale une erreur interne si le flux se termine sans résultat", async () => {
    fetchMock.mockResolvedValue(ndjson(['{"phase":"validation"}\n']));

    expect(await streamNatalChart(() => undefined)).toBe("internal_error");
  });

  it("lit le code d'une réponse HTTP en erreur", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "birth_data_not_found" } }), { status: 404 }),
    );

    expect(await streamNatalChart(() => undefined)).toBe("birth_data_not_found");
  });

  it("renvoie une erreur interne si la réponse en erreur n'est pas du JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502 }));

    expect(await streamNatalChart(() => undefined)).toBe("internal_error");
  });

  it("refuse sans session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null } as never);

    expect(await streamNatalChart(() => undefined)).toBe("unauthenticated");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie network_error si la requête échoue", async () => {
    fetchMock.mockRejectedValue(new TypeError("failed"));

    expect(await streamNatalChart(() => undefined)).toBe("network_error");
  });

  it("ne signale pas d'erreur quand la requête est annulée", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValue(new DOMException("aborted", "AbortError"));

    expect(await streamNatalChart(() => undefined, controller.signal)).toBeNull();
  });
});
