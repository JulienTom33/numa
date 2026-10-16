import { extractBearerToken } from "../_shared/auth.ts";
import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import { computeNatalChart } from "./compute.ts";
import type { BirthDataStore } from "./store.ts";

export interface NatalChartDependencies {
  store: BirthDataStore;
}

export function createNatalChartHandler({ store }: NatalChartDependencies) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    const token = extractBearerToken(req);
    if (token === null) throw new HttpError(401, "unauthenticated", "unauthenticated");

    const birth = await store.findLatest(token, caller.userId);
    if (birth === null) throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");

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
