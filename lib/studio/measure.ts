import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

export const TP_GATE_DBTP = -1.0;
export const METER_LABEL = "ffmpeg ebur128 (peak=true)";

export type ProbeInfo = {
  codec_name: string | null;
  sample_rate_hz: number | null;
  channels: number | null;
  duration_sec: number | null;
  format_name: string | null;
};

export type MeasureResult = {
  ok: boolean;
  meter: string;
  loudness_lufs: number | null;
  true_peak_dbtp: number | null;
  lra: number | null;
  gate_dbtp: number;
  gate_pass: boolean | null;
  error?: string;
  true_peak_unit_note?: string;
};

export type QcMetrics = {
  loudness_lufs: number | null;
  true_peak_dbtp: number | null;
  lra: number | null;
  gate_pass: boolean | null;
};

export type QcMasterInfo = {
  applied: boolean;
  method: "alimiter" | "copy" | "none";
  filter?: string;
  limit_linear?: number;
  target_dbtp: number;
  output_wav: boolean;
  note: string;
};

export type QcJson = {
  jobId: string;
  status: "done" | "error";
  filename: string;
  /** Original upload extension without dot, e.g. wav|flac|mp3 */
  original_format?: string;
  created_at: string;
  measured_at: string;
  probe: ProbeInfo | null;
  meter: string;
  /** Input (before) metrics — kept at top level for Increment 1 compat */
  loudness_lufs: number | null;
  true_peak_dbtp: number | null;
  lra: number | null;
  gate_dbtp: number;
  gate_pass: boolean | null;
  increment: "measure-only" | "tp-safety";
  note: string;
  input?: QcMetrics;
  output?: QcMetrics | null;
  master?: QcMasterInfo;
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

export function probeAudio(filePath: string): ProbeInfo {
  const p = run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=codec_name,sample_rate,channels,duration:format=duration,format_name",
    "-of",
    "json",
    filePath,
  ]);
  if (p.code !== 0) {
    throw new Error(`ffprobe failed: ${p.stderr.trim() || p.stdout.trim()}`);
  }
  const data = JSON.parse(p.stdout || "{}") as {
    streams?: Array<Record<string, string>>;
    format?: Record<string, string>;
  };
  const streams = data.streams || [];
  if (!streams.length) throw new Error("no audio stream");
  const s = streams[0];
  const fmt = data.format || {};
  const duration = s.duration || fmt.duration;
  return {
    codec_name: s.codec_name ?? null,
    sample_rate_hz: s.sample_rate ? parseInt(s.sample_rate, 10) : null,
    channels: s.channels ? parseInt(s.channels, 10) : null,
    duration_sec: duration ? parseFloat(duration) : null,
    format_name: fmt.format_name ?? null,
  };
}

/** Read-only ebur128 null-sink measure. Does not rewrite audio. */
export function measureEbur128(filePath: string): MeasureResult {
  const p = run("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    filePath,
    "-af",
    "ebur128=peak=true",
    "-f",
    "null",
    "-",
  ]);
  const text = `${p.stderr}\n${p.stdout}`;
  if (!text.includes("Summary:")) {
    return {
      ok: false,
      meter: METER_LABEL,
      loudness_lufs: null,
      true_peak_dbtp: null,
      lra: null,
      gate_dbtp: TP_GATE_DBTP,
      gate_pass: null,
      error: "ebur128 summary missing",
    };
  }
  const summary = text.split("Summary:").slice(1).join("Summary:");
  const mI = summary.match(/I:\s*([+-]?\d+(?:\.\d+)?)\s*LUFS/);
  const mLra = summary.match(/LRA:\s*([+-]?\d+(?:\.\d+)?)\s*LU/);
  const mPeak = summary.match(/True peak:\s*Peak:\s*([+-]?\d+(?:\.\d+)?)\s*dB/);
  if (!mI || !mPeak) {
    return {
      ok: false,
      meter: METER_LABEL,
      loudness_lufs: null,
      true_peak_dbtp: null,
      lra: mLra ? parseFloat(mLra[1]) : null,
      gate_dbtp: TP_GATE_DBTP,
      gate_pass: null,
      error: "could not parse I/Peak from ebur128 summary",
    };
  }
  const loudness_lufs = parseFloat(mI[1]);
  const true_peak_dbtp = parseFloat(mPeak[1]);
  const lra = mLra ? parseFloat(mLra[1]) : null;
  const gate_pass = true_peak_dbtp <= TP_GATE_DBTP;
  return {
    ok: true,
    meter: METER_LABEL,
    loudness_lufs,
    true_peak_dbtp,
    lra,
    gate_dbtp: TP_GATE_DBTP,
    gate_pass,
    true_peak_unit_note:
      "ffmpeg ebur128 True peak Peak line (dBFS); treated as dBTP for gate",
  };
}

export function studioJobsRoot(): string {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  return path.join(dataDir, "studio", "jobs");
}

export function jobDir(jobId: string): string {
  return path.join(studioJobsRoot(), jobId);
}

export function readQc(jobId: string): QcJson | null {
  const qcPath = path.join(jobDir(jobId), "qc.json");
  if (!fs.existsSync(qcPath)) return null;
  return JSON.parse(fs.readFileSync(qcPath, "utf-8")) as QcJson;
}

export function writeQc(jobId: string, qc: QcJson): void {
  const dir = jobDir(jobId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "qc.json"), JSON.stringify(qc, null, 2), "utf-8");
}

export function metricsFromMeasure(m: MeasureResult): QcMetrics {
  return {
    loudness_lufs: m.loudness_lufs,
    true_peak_dbtp: m.true_peak_dbtp,
    lra: m.lra,
    gate_pass: m.gate_pass,
  };
}
