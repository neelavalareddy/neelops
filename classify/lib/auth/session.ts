import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  world_id_nullifier_hash: string;
  role: "worker" | "company" | "admin";
}

interface SessionPayload {
  sub: string;
  wid: string;
  role: SessionUser["role"];
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }
  return secret;
}

function encode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    sub: user.id,
    wid: user.world_id_nullifier_hash,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const body = encode(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function createGodModeSessionToken(): string {
  return createSessionToken({
    id: "god-mode",
    world_id_nullifier_hash: "god-mode",
    role: "admin",
  });
}

export function parseSessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(body)) as Partial<SessionPayload>;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.wid !== "string" ||
      (payload.role !== "worker" && payload.role !== "company" && payload.role !== "admin") ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp <= Date.now()) {
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

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionMaxAgeSeconds(): number {
  return Math.floor(SESSION_TTL_MS / 1000);
}
