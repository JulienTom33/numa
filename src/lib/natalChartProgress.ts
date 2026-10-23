import { toKnownErrorCode, type NatalChartErrorCode } from "./natalChart";
import { CHART_PHASES, type ChartPhase } from "../../shared/contracts/natalChart/natalChart.ts";
import { supabase } from "./supabaseClient";


interface StreamEvent {
  phase?: unknown;
  chart?: unknown;
  error?: { code?: unknown };
}

function isPhase(value: unknown): value is ChartPhase {
  return CHART_PHASES.some((phase) => phase === value);
}

async function readHttpError(response: Response): Promise<NatalChartErrorCode> {
  try {
    const body = (await response.json()) as StreamEvent;
    return toKnownErrorCode(body.error?.code);
  } catch {
    return "internal_error";
  }
}

async function consume(
  body: ReadableStream<Uint8Array>,
  onPhase: (phase: ChartPhase) => void,
): Promise<NatalChartErrorCode | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outcome: NatalChartErrorCode | null | undefined;

  const handleLine = (line: string) => {
    if (line.trim() === "" || outcome !== undefined) return;
    const event = JSON.parse(line) as StreamEvent;
    if (isPhase(event.phase)) onPhase(event.phase);
    else if (event.error) outcome = toKnownErrorCode(event.error.code);
    else if (event.chart) outcome = null;
  };

  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handleLine);
    if (done) break;
  }
  handleLine(buffer);
  return outcome === undefined ? "internal_error" : outcome;
}

export async function streamNatalChart(
  onPhase: (phase: ChartPhase) => void,
  signal?: AbortSignal,
): Promise<NatalChartErrorCode | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return "unauthenticated";

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/natal-chart?progress=1`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      signal,
    });
    if (!response.ok) return await readHttpError(response);
    if (!response.body) return "internal_error";
    return await consume(response.body, onPhase);
  } catch {
    return signal?.aborted ? null : "network_error";
  }
}
