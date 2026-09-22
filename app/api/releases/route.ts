import { NextResponse } from "next/server";
import { listReleases } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const releases = listReleases();
    return NextResponse.json({ releases });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
