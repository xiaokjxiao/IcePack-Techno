const NETWORK_ERROR_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /network error/i,
  /abort/i,
  /timeout/i,
  /unreachable/i,
  /connection refused/i,
];

export function isNetworkError(error: unknown): boolean {
  const message = (() => {
    if (error instanceof Error) return error.message;
    const err = error as Record<string, unknown> | null | undefined;
    if (err && typeof err.message === "string") return err.message;
    return String(error ?? "");
  })();
  return NETWORK_ERROR_PATTERNS.some((p) => p.test(message));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastError = e;
      const net = isNetworkError(e);
      if (!net || attempt >= maxRetries) {
        if (attempt > 0) {
          console.warn(`withRetry: attempt ${attempt + 1}/${maxRetries + 1} failed, giving up`);
        }
        throw e;
      }
      console.warn(
        `withRetry: attempt ${attempt + 1}/${maxRetries + 1} failed (network), retrying in ${delayMs * (attempt + 1)}ms...`,
        String(e),
      );
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export function getUserNetworkErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "No internet connection. Please check your network and try again.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    return (typeof e.message === "string" ? e.message : null)
      ?? (typeof e.details === "string" ? e.details : null)
      ?? "Failed to create shipment";
  }
  return "Failed to create shipment";
}
