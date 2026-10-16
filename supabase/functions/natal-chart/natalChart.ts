import { extractBearerToken } from "../_shared/auth.ts";
import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import { computeNatalChart } from "./compute.ts";
import type { ChartPhase } from "./types.ts";
import type { BirthDataStore } from "./store.ts";

export interface NatalChartDependencies {
  store: BirthDataStore;
}

const PROGRESS_PARAM = "progress";
const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

function streamChart(birth: Parameters<typeof computeNatalChart>[0]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}
`));
      const phase = (name: ChartPhase) => send({ phase: name });
      try {
        phase("validation");
        send({ chart: computeNatalChart(birth, phase) });
      } catch (error) {
        const code = error instanceof RangeError ? "invalid_birth_data" : "internal_error";
        send({ error: { code, message: code } });
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": NDJSON_CONTENT_TYPE, "Cache-Control": "no-store" },
  });
}

export function createNatalChartHandler({ store }: NatalChartDependencies) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    const token = extractBearerToken(req);
    if (token === null) throw new HttpError(401, "unauthenticated", "unauthenticated");

    const birth = await store.findLatest(token, caller.userId);
    if (birth === null) throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");

    if (new URL(req.url).searchParams.get(PROGRESS_PARAM) === "1") return streamChart(birth);

    try {
      return json({ chart: computeNatalChart(birth) }, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (error instanceof RangeError) {
        throw new HttpError(422, "invalid_birth_data", "invalid_birth_data");
      }
      throw error;
    }
  };
}
