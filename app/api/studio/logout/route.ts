import { NextResponse } from "next/server";
import {
  sessionCookieOptions,
  STUDIO_SESSION_COOKIE,
} from "@/lib/studio/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STUDIO_SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
