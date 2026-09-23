import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { jobDir } from "@/lib/studio/measure";
import { requireStudioAuth } from "@/lib/studio/auth";
import { sweepExpiredStudioJobs } from "@/lib/studio/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

const ALLOWED = new Set(["qc.json", "output.wav"]);

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireStudioAuth(req);
  if (denied) return denied;
  sweepExpiredStudioJobs();
  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid job id" }, { status: 400 });
  }

  const fileParam = (req.nextUrl.searchParams.get("file") || "qc.json").toLowerCase();
  if (!ALLOWED.has(fileParam)) {
    return NextResponse.json(
      { error: "file must be qc.json or output.wav" },
      { status: 400 }
    );
  }

  const filePath = path.join(jobDir(id), fileParam);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: `${fileParam} not found` }, { status: 404 });
  }

  const body = fs.readFileSync(filePath);
  if (fileParam === "output.wav") {
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="output-${id}.wav"`,
        "Cache-Control": "no-store",
        "Content-Length": String(body.length),
      },
    });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="qc-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
