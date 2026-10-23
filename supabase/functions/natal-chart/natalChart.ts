import { extractBearerToken } from "../_shared/auth.ts";
import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import type { ChartCache } from "./cache.ts";
import { computeCacheKey } from "./cacheKey.ts";
import { computeNatalChart } from "./compute.ts";
import type { BirthDataStore, BirthRecord } from "./store.ts";
import { CHART_PHASES } from "../../../shared/contracts/natalChart/natalChart.ts";
import type { ChartPhase, NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";

export interface NatalChartDependencies {
  store: BirthDataStore;
  cache: ChartCache;
}

const PROGRESS_PARAM = "progress";
const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

interface CacheContext {
  cache: ChartCache;
  userId: string;
  record: BirthRecord;
  key: string;
}

async function readCached(context: CacheContext): Promise<NatalChart | null> {
  try {
    return await context.cache.find(context.record.id, context.key);
  } catch {
    return null;
  }
}

async function writeCached(context: CacheContext, chart: NatalChart): Promise<void> {
  try {
    await context.cache.save(context.userId, context.record.id, context.key, chart);
  } catch {
    return;
  }
}

function streamChart(context: CacheContext): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}
`));
      const phase = (name: ChartPhase) => send({ phase: name });
      try {
        phase("validation");
        const cached = await readCached(context);
        if (cached !== null) {
          CHART_PHASES.slice(1).forEach(phase);
          send({ chart: cached, cached: true });
        } else {
          const chart = computeNatalChart(context.record.birth, phase);
          await writeCached(context, chart);
          send({ chart, cached: false });
        }
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

export function createNatalChartHandler({ store, cache }: NatalChartDependencies) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    const token = extractBearerToken(req);
    if (token === null) throw new HttpError(401, "unauthenticated", "unauthenticated");

    const record = await store.findLatest(token, caller.userId);
    if (record === null) throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");

    const context: CacheContext = {
      cache,
      userId: caller.userId,
      record,
      key: await computeCacheKey(record.birth),
    };

    if (new URL(req.url).searchParams.get(PROGRESS_PARAM) === "1") return streamChart(context);

    const headers = { "Cache-Control": "no-store" };
    const cached = await readCached(context);
    if (cached !== null) return json({ chart: cached, cached: true }, { headers });

    try {
      const chart = computeNatalChart(record.birth);
      await writeCached(context, chart);
      return json({ chart, cached: false }, { headers });
    } catch (error) {
      if (error instanceof RangeError) {
        throw new HttpError(422, "invalid_birth_data", "invalid_birth_data");
      }
      throw error;
    }
  };
}
