import { SESSION_COOKIE } from "@/lib/auth/constants";

export interface EdgeSessionUser {
  id: string;
  world_id_nullifier_hash: string;
  role: "worker" | "company" | "admin";
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return atob(padded);
}

async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function parseSessionTokenEdge(token: string | undefined, secret: string): Promise<EdgeSessionUser | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await sign(body, secret);
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as Partial<{
      sub: string;
      wid: string;
      role: EdgeSessionUser["role"];
      exp: number;
    }>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.wid !== "string" ||
      (payload.role !== "worker" && payload.role !== "company" && payload.role !== "admin") ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return {
      id: payload.sub,
      world_id_nullifier_hash: payload.wid,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function getEdgeSessionCookieName(): string {
  return SESSION_COOKIE;
}
