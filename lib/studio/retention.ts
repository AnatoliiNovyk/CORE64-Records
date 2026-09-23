/**
 * Delete studio job dirs older than 24h (mtime or qc.created_at).
 * Call on request paths (upload / job / download / session) — opportunistic sweep.
 */
import fs from "fs";
import path from "path";
import { studioJobsRoot } from "./measure";

export const JOB_TTL_HOURS = 24;
export const JOB_TTL_MS = JOB_TTL_HOURS * 60 * 60 * 1000;
export const JOB_TTL_NOTE =
  "Job files (uploads, output.wav, qc.json) are deleted automatically after 24 hours.";

function jobAgeMs(dirPath: string): number {
  const qcPath = path.join(dirPath, "qc.json");
  try {
    if (fs.existsSync(qcPath)) {
      const raw = JSON.parse(fs.readFileSync(qcPath, "utf-8")) as {
        created_at?: string;
      };
      if (raw.created_at) {
        const t = Date.parse(raw.created_at);
        if (Number.isFinite(t)) return Date.now() - t;
      }
    }
  } catch {
    /* fall through to mtime */
  }
  try {
    const st = fs.statSync(dirPath);
    return Date.now() - st.mtimeMs;
  } catch {
    return 0;
  }
}

export type SweepResult = { scanned: number; deleted: number };

/** Best-effort sweep; never throws to callers. */
export function sweepExpiredJobs(): SweepResult {
  const root = studioJobsRoot();
  const out: SweepResult = { scanned: 0, deleted: 0 };
  try {
    if (!fs.existsSync(root)) return out;
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      out.scanned += 1;
      const dirPath = path.join(root, ent.name);
      try {
        if (jobAgeMs(dirPath) > JOB_TTL_MS) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          out.deleted += 1;
        }
      } catch {
        /* skip one bad dir */
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Alias used by studio routes. */
export const sweepExpiredStudioJobs = sweepExpiredJobs;
