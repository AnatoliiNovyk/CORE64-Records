import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  isStudioAuthConfigured,
  passwordsMatch,
  sessionCookieOptions,
  STUDIO_SESSION_COOKIE,
} from "@/lib/studio/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isStudioAuthConfigured()) {
    return NextResponse.json(
      { error: "studio auth not configured" },
      { status: 503 }
    );
  }

  let password = "";
  const ctype = (req.headers.get("content-type") || "").toLowerCase();
  try {
    if (ctype.includes("application/json")) {
      const body = (await req.json()) as { password?: unknown };
      password = typeof body.password === "string" ? body.password : "";
    } else {
      const form = await req.formData();
      const v = form.get("password");
      password = typeof v === "string" ? v : "";
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!passwordsMatch(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "studio auth not configured" },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(STUDIO_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
