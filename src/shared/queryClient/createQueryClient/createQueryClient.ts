import { QueryClient } from "@tanstack/react-query";
import { CodedQueryError } from "../CodedQueryError/CodedQueryError";

const MAX_NETWORK_RETRIES = 2;
const STALE_TIME_MS = 30_000;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return error instanceof CodedQueryError && error.code === "network_error" && failureCount < MAX_NETWORK_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}
