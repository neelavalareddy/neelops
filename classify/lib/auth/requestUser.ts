import { cookies } from "next/headers";
import {
  getSessionCookieName,
  parseSessionToken,
  type SessionUser,
} from "@/lib/auth/session";

export function getRequestSessionUser(): SessionUser | null {
  return parseSessionToken(cookies().get(getSessionCookieName())?.value);
}

export function resolveRequestWorkerNullifier(
  submittedNullifier: string | null | undefined
): { user: SessionUser | null; nullifierHash: string | null; error?: string; status?: number } {
  const user = getRequestSessionUser();
  const trimmedSubmitted = submittedNullifier?.trim() || null;

  if (user?.role === "worker") {
    if (trimmedSubmitted && trimmedSubmitted !== user.world_id_nullifier_hash) {
      return {
        user,
        nullifierHash: null,
        error: "Submitted worker identity does not match the active session.",
        status: 403,
      };
    }

    return {
      user,
      nullifierHash: user.world_id_nullifier_hash,
    };
  }

  if (trimmedSubmitted) {
    return {
      user,
      nullifierHash: trimmedSubmitted,
    };
  }

  return {
    user,
    nullifierHash: null,
    error: "Worker identity is required.",
    status: 400,
  };
}
