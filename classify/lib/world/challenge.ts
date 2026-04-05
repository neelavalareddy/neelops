import { createHmac, timingSafeEqual } from "crypto";

type ChallengePayload = {
  kind: string;
  sub: string;
  nonce: string;
  exp: number;
};

function getChallengeSecret(): string {
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

function sign(body: string): string {
  return createHmac("sha256", getChallengeSecret()).update(body).digest("base64url");
}

export function createSignedChallenge(kind: string, subject: string, nonce: string, ttlMs: number): string {
  const body = encode(
    JSON.stringify({
      kind,
      sub: subject,
      nonce,
      exp: Date.now() + ttlMs,
    } satisfies ChallengePayload)
  );
  return `${body}.${sign(body)}`;
}

export function parseSignedChallenge(token: string | undefined | null): ChallengePayload | null {
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
    const payload = JSON.parse(decode(body)) as Partial<ChallengePayload>;
    if (
      typeof payload.kind !== "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return payload as ChallengePayload;
  } catch {
    return null;
  }
}
