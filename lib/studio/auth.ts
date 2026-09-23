/**
 * Studio access gate — password from STUDIO_ACCESS_PASSWORD only.
 * Fail-closed when env missing. Never log password or session secret.
 */
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const STUDIO_SESSION_COOKIE = "c64_studio_session";
/** Session lifetime (cookie); independent of 24h job retention. */
export const SESSION_MAX_AGE_SEC = 12 * 60 * 60;
/** Documented job artifact TTL (hours). */
export const JOB_RETENTION_HOURS = 24;

export function getStudioPassword(): string | null {
  const p = process.env.STUDIO_ACCESS_PASSWORD;
  if (typeof p !== "string" || p.length === 0) return null;
  return p;
}

export function isStudioAuthConfigured(): boolean {
  return getStudioPassword() !== null;
}

/** HMAC key: SESSION_SECRET if set (≥16), else derived from password (never logged). */
function sessionSecretKey(): Buffer | null {
  const explicit = process.env.SESSION_SECRET;
  if (typeof explicit === "string" && explicit.length >= 16) {
    return createHash("sha256").update(`core64-session:${explicit}`).digest();
  }
  const pw = getStudioPassword();
  if (!pw) return null;
  return createHash("sha256").update(`core64-studio-v1:${pw}`).digest();
}

/** Timing-safe password check via SHA-256 digests (equal-length compare). */
export function passwordsMatch(provided: string): boolean {
  const expected = getStudioPassword();
  if (!expected) return false;
  const a = createHash("sha256").update(String(provided ?? ""), "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string | null {
  const secret = sessionSecretKey();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = `v1.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const secret = sessionSecretKey();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const payload = `v1.${parts[1]}`;
  const expectedHex = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(parts[2], "utf8");
    const b = Buffer.from(expectedHex, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function isStudioAuthenticated(req: NextRequest): boolean {
  if (!isStudioAuthConfigured()) return false;
  return verifySessionToken(req.cookies.get(STUDIO_SESSION_COOKIE)?.value);
}

/** For Server Components (cookies() from next/headers). */
export function isStudioAuthenticatedFromCookies(): boolean {
  if (!isStudioAuthConfigured()) return false;
  return verifySessionToken(cookies().get(STUDIO_SESSION_COOKIE)?.value);
}

/** null = authorized; otherwise return this response. */
export function requireStudioAuth(req: NextRequest): NextResponse | null {
  if (!isStudioAuthConfigured()) {
    return NextResponse.json(
      { error: "studio auth not configured" },
      { status: 503 }
    );
  }
  if (!isStudioAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
