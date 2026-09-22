/**
 * Studio true-peak safety master (Increment 2).
 *
 * STUDIO TOOL ONLY — not factory packaging DSP.
 * Factory remains measure+package with HARD BAN on remaster.
 * This module may rewrite audio solely for /studio downloadable output.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import { TP_GATE_DBTP } from "./measure";

/** Linear peak ≈ −1.0 dBTP: 10^(-1/20) */
export const ALIMITER_LIMIT_LINEAR = 0.8912509381337456;
export const ALIMITER_FILTER = `alimiter=limit=${ALIMITER_LIMIT_LINEAR}:level=disabled`;

export type MasterMethod = "alimiter" | "copy" | "none";

export type MasterResult = {
  ok: boolean;
  applied: boolean;
  method: MasterMethod;
  filter?: string;
  limit_linear?: number;
  target_dbtp: number;
  output_wav: boolean;
  note: string;
  error?: string;
};

function run(cmd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const p = spawnSync(cmd, args, {
    encoding: "utf-8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    code: p.status ?? 1,
    stdout: p.stdout?.toString() ?? "",
    stderr: p.stderr?.toString() ?? "",
  };
}

/**
 * Apply ffmpeg alimiter true-peak safety → outputPath (WAV PCM).
 * Only call when measured TP exceeds TP_GATE_DBTP.
 */
export function applyTruePeakSafety(
  inputPath: string,
  outputPath: string
): MasterResult {
  const p = run("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    inputPath,
    "-af",
    ALIMITER_FILTER,
    "-c:a",
    "pcm_s24le",
    outputPath,
  ]);
  if (p.code !== 0 || !fs.existsSync(outputPath)) {
    return {
      ok: false,
      applied: false,
      method: "none",
      target_dbtp: TP_GATE_DBTP,
      output_wav: false,
      note: "alimiter failed",
      error: (p.stderr || p.stdout || "ffmpeg alimiter failed").trim().slice(0, 800),
    };
  }
  return {
    ok: true,
    applied: true,
    method: "alimiter",
    filter: ALIMITER_FILTER,
    limit_linear: ALIMITER_LIMIT_LINEAR,
    target_dbtp: TP_GATE_DBTP,
    output_wav: true,
    note: `Studio tool: ffmpeg ${ALIMITER_FILTER} → ≤ ${TP_GATE_DBTP} dBTP (NOT factory DSP)`,
  };
}

/** Copy input → output when already under gate (no DSP rewrite). */
export function copyInputAsOutput(
  inputPath: string,
  outputPath: string
): MasterResult {
  try {
    fs.copyFileSync(inputPath, outputPath);
    return {
      ok: true,
      applied: false,
      method: "copy",
      target_dbtp: TP_GATE_DBTP,
      output_wav: true,
      note: `Input already ≤ ${TP_GATE_DBTP} dBTP; output.wav is a copy (no alimiter)`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      applied: false,
      method: "none",
      target_dbtp: TP_GATE_DBTP,
      output_wav: false,
      note: "copy failed",
      error: message,
    };
  }
}
