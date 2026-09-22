import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { jobDir } from "@/lib/studio/measure";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid job id" }, { status: 400 });
  }
  const qcPath = path.join(jobDir(id), "qc.json");
  if (!fs.existsSync(qcPath)) {
    return NextResponse.json({ error: "qc.json not found" }, { status: 404 });
  }
  const body = fs.readFileSync(qcPath);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="qc-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
