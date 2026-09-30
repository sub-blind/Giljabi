export type ConnectionState = "connecting" | "ready" | "error";

const automaticRetryDelays = [5_000, 15_000, 30_000] as const;

export function connectionTimeoutsForAttempt(attempt: number): number[] {
  return attempt === 0 ? [65_000, 10_000] : [15_000];
}

export function nextConnectionRetryDelay(attempt: number): number | null {
  return automaticRetryDelays[attempt] ?? null;
}

export function canTryServerFeature(state: ConnectionState, featureReady: boolean): boolean {
  return state !== "ready" || featureReady;
}
