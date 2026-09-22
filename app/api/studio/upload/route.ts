import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  jobDir,
  measureEbur128,
  metricsFromMeasure,
  probeAudio,
  writeQc,
  type QcJson,
} from "@/lib/studio/measure";
import { applyTruePeakSafety, copyInputAsOutput } from "@/lib/studio/master";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 80 * 1024 * 1024; // 80 MB
const ALLOWED_EXT = new Set([".wav"]);
const ALLOWED_MIME = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "application/octet-stream",
]);

function safeExt(name: string): string {
  const ext = path.extname(name || "").toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "missing file field" }, { status: 400 });
    }
    const blob = file as File;
    const originalName = blob.name || "input.wav";
    const ext = safeExt(originalName);
    if (!ext) {
      return NextResponse.json(
        { error: "WAV only for studio v0 (.wav)" },
        { status: 400 }
      );
    }
    const mime = (blob.type || "").toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: `unsupported content-type: ${mime}` },
        { status: 400 }
      );
    }
    if (typeof blob.size === "number" && blob.size > MAX_BYTES) {
      return NextResponse.json({ error: "file too large (max 80MB)" }, { status: 413 });
    }

    const jobId = randomUUID();
    const dir = jobDir(jobId);
    fs.mkdirSync(dir, { recursive: true });
    const inputPath = path.join(dir, `input${ext}`);
    const outputPath = path.join(dir, "output.wav");
    const buf = Buffer.from(await blob.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      fs.rmSync(dir, { recursive: true, force: true });
      return NextResponse.json({ error: "file too large (max 80MB)" }, { status: 413 });
    }
    fs.writeFileSync(inputPath, buf);

    const created_at = new Date().toISOString();
    let probe = null as QcJson["probe"];
    let inputMeasure;
    try {
      probe = probeAudio(inputPath);
      inputMeasure = measureEbur128(inputPath);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const qc: QcJson = {
        jobId,
        status: "error",
        filename: originalName,
        created_at,
        measured_at: new Date().toISOString(),
        probe,
        meter: "ffmpeg ebur128 (peak=true)",
        loudness_lufs: null,
        true_peak_dbtp: null,
        lra: null,
        gate_dbtp: -1.0,
        gate_pass: null,
        increment: "tp-safety",
        note: "Increment 2: measure/master failed before safety step",
        error: message,
      };
      writeQc(jobId, qc);
      return NextResponse.json({ jobId, qc }, { status: 500 });
    }

    if (!inputMeasure.ok) {
      const qc: QcJson = {
        jobId,
        status: "error",
        filename: originalName,
        created_at,
        measured_at: new Date().toISOString(),
        probe,
        meter: inputMeasure.meter,
        loudness_lufs: inputMeasure.loudness_lufs,
        true_peak_dbtp: inputMeasure.true_peak_dbtp,
        lra: inputMeasure.lra,
        gate_dbtp: inputMeasure.gate_dbtp,
        gate_pass: inputMeasure.gate_pass,
        increment: "tp-safety",
        note: "Increment 2: input measure failed",
        input: metricsFromMeasure(inputMeasure),
        output: null,
        error: inputMeasure.error,
      };
      writeQc(jobId, qc);
      return NextResponse.json({ jobId, qc }, { status: 500 });
    }

    const inputMetrics = metricsFromMeasure(inputMeasure);
    const needsMaster = inputMeasure.gate_pass === false;

    const master = needsMaster
      ? applyTruePeakSafety(inputPath, outputPath)
      : copyInputAsOutput(inputPath, outputPath);

    if (!master.ok) {
      const qc: QcJson = {
        jobId,
        status: "error",
        filename: originalName,
        created_at,
        measured_at: new Date().toISOString(),
        probe,
        meter: inputMeasure.meter,
        loudness_lufs: inputMeasure.loudness_lufs,
        true_peak_dbtp: inputMeasure.true_peak_dbtp,
        lra: inputMeasure.lra,
        gate_dbtp: inputMeasure.gate_dbtp,
        gate_pass: inputMeasure.gate_pass,
        increment: "tp-safety",
        note: "Increment 2: true-peak safety / copy failed",
        input: inputMetrics,
        output: null,
        master: {
          applied: master.applied,
          method: master.method,
          filter: master.filter,
          limit_linear: master.limit_linear,
          target_dbtp: master.target_dbtp,
          output_wav: master.output_wav,
          note: master.note,
        },
        error: master.error,
      };
      writeQc(jobId, qc);
      return NextResponse.json({ jobId, qc }, { status: 500 });
    }

    const outputMeasure = measureEbur128(outputPath);
    const outputMetrics = outputMeasure.ok
      ? metricsFromMeasure(outputMeasure)
      : null;

    const qc: QcJson = {
      jobId,
      status: outputMeasure.ok ? "done" : "error",
      filename: originalName,
      created_at,
      measured_at: new Date().toISOString(),
      probe,
      meter: inputMeasure.meter,
      loudness_lufs: inputMeasure.loudness_lufs,
      true_peak_dbtp: inputMeasure.true_peak_dbtp,
      lra: inputMeasure.lra,
      gate_dbtp: inputMeasure.gate_dbtp,
      gate_pass: inputMeasure.gate_pass,
      increment: "tp-safety",
      note: master.note,
      input: inputMetrics,
      output: outputMetrics,
      master: {
        applied: master.applied,
        method: master.method,
        filter: master.filter,
        limit_linear: master.limit_linear,
        target_dbtp: master.target_dbtp,
        output_wav: master.output_wav,
        note: master.note,
      },
      ...(outputMeasure.error ? { error: outputMeasure.error } : {}),
    };
    writeQc(jobId, qc);

    return NextResponse.json({ jobId, qc });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
