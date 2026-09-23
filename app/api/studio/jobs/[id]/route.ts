import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { jobDir, readQc } from "@/lib/studio/measure";
import { requireStudioAuth } from "@/lib/studio/auth";
import { sweepExpiredStudioJobs } from "@/lib/studio/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireStudioAuth(req);
  if (denied) return denied;
  sweepExpiredStudioJobs();
  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid job id" }, { status: 400 });
  }
  const dir = jobDir(id);
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  const qc = readQc(id);
  if (!qc) {
    return NextResponse.json({ jobId: id, status: "pending", qc: null });
  }
  return NextResponse.json({ jobId: id, status: qc.status, qc });
}
