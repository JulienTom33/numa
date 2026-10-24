export type LoadStatus = "loading" | "ready" | "error";

interface QueryState {
  isSuccess: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function loadStatus({ isSuccess, isError, isFetching }: QueryState): LoadStatus {
  if (isSuccess) return "ready";
  if (isError && !isFetching) return "error";
  return "loading";
}
