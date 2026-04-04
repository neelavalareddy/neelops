/** World ID nullifier stored after verify so the worker dashboard can load your history. */

export const WORKER_NULLIFIER_KEY = "classify_worker_nullifier";

export function persistWorkerNullifier(nullifierHash: string): void {
  if (typeof window === "undefined" || !nullifierHash?.trim()) return;
  try {
    localStorage.setItem(WORKER_NULLIFIER_KEY, nullifierHash.trim());
  } catch {
    /* quota / private mode */
  }
}

export function getWorkerNullifier(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(WORKER_NULLIFIER_KEY);
    return v?.trim() || null;
  } catch {
    return null;
  }
}

export function clearWorkerNullifier(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WORKER_NULLIFIER_KEY);
  } catch {
    /* */
  }
}
