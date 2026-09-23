import { NextRequest, NextResponse } from "next/server";
import {
  JOB_RETENTION_HOURS,
  isStudioAuthConfigured,
  isStudioAuthenticated,
} from "@/lib/studio/auth";
import { sweepExpiredStudioJobs } from "@/lib/studio/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  sweepExpiredStudioJobs();

  if (!isStudioAuthConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        authenticated: false,
        retention_hours: JOB_RETENTION_HOURS,
        error: "studio access not configured",
      },
      { status: 503 }
    );
  }

  const authenticated = isStudioAuthenticated(req);
  if (!authenticated) {
    return NextResponse.json(
      {
        configured: true,
        authenticated: false,
        retention_hours: JOB_RETENTION_HOURS,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    configured: true,
    authenticated: true,
    retention_hours: JOB_RETENTION_HOURS,
  });
}
