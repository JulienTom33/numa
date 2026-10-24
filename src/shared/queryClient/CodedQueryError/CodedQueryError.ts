export class CodedQueryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "CodedQueryError";
    this.code = code;
  }
}

export function unwrapResult<T>(data: T | null, errorCode: string | null, fallbackCode = "internal_error"): T {
  if (errorCode !== null) throw new CodedQueryError(errorCode);
  if (data === null) throw new CodedQueryError(fallbackCode);
  return data;
}

export function errorCodeOf<C extends string>(error: unknown, known: readonly C[], fallback: C): C {
  if (!(error instanceof CodedQueryError)) return fallback;
  return known.find((code) => code === error.code) ?? fallback;
}
