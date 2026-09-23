"use client";

import { useCallback, useState } from "react";

type QcMetrics = {
  loudness_lufs: number | null;
  true_peak_dbtp: number | null;
  lra: number | null;
  gate_pass: boolean | null;
};

type Qc = {
  jobId: string;
  status: string;
  filename: string;
  loudness_lufs: number | null;
  true_peak_dbtp: number | null;
  lra: number | null;
  gate_dbtp: number;
  gate_pass: boolean | null;
  meter: string;
  increment: string;
  note: string;
  error?: string;
  input?: QcMetrics;
  output?: QcMetrics | null;
  master?: {
    applied: boolean;
    method: string;
    output_wav: boolean;
    note: string;
    target_dbtp: number;
  };
  probe?: {
    codec_name: string | null;
    sample_rate_hz: number | null;
    channels: number | null;
    duration_sec: number | null;
  } | null;
};

function fmtTp(v: number | null | undefined): string {
  return v != null ? `${v} dBTP` : "—";
}

function fmtGate(pass: boolean | null | undefined): string {
  if (pass == null) return "—";
  return pass ? "PASS" : "FAIL (over gate)";
}

export default function StudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qc, setQc] = useState<Qc | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const onUpload = useCallback(async () => {
    if (!file) {
      setError("Choose a WAV, FLAC, or MP3 file first");
      return;
    }
    setBusy(true);
    setError(null);
    setQc(null);
    setJobId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/studio/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok && !data.qc) {
        throw new Error(data.error || `upload failed (${res.status})`);
      }
      setJobId(data.jobId);
      setQc(data.qc);
      if (!res.ok) {
        setError(data.qc?.error || data.error || "measure/master failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [file]);

  const beforeTp = qc?.input?.true_peak_dbtp ?? qc?.true_peak_dbtp ?? null;
  const afterTp = qc?.output?.true_peak_dbtp ?? null;
  const hasOutput = Boolean(qc?.master?.output_wav);

  return (
    <main className="admin-shell">
      <span className="badge">CORE64 Records · Studio</span>
      <h1>Recording studio</h1>
      <p className="muted" style={{ marginTop: 0 }}>Primary product on records.core64.studio — upload → QC → TP master → download.</p>
      <p className="muted">
        Upload WAV / FLAC / MP3 → ffmpeg decode → ebur128 QC → if True Peak &gt; −1.0 dBTP,
        apply ffmpeg alimiter safety (studio tool, not factory). Download output.wav + qc.json.
      </p>
      <div className="nav">
        <a href="/admin">Admin</a>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <strong>Upload audio</strong>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Accepts WAV, FLAC, or MP3. Output is always output.wav + qc.json.
        </p>
        <input
          type="file"
          accept=".wav,.flac,.mp3,audio/wav,audio/x-wav,audio/wave,audio/flac,audio/x-flac,audio/mpeg,audio/mp3"
          disabled={busy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            onClick={onUpload}
            disabled={busy || !file}
            style={{
              background: "var(--accent)",
              color: "#0b0b0f",
              border: "none",
              borderRadius: 8,
              padding: "0.55rem 1rem",
              fontWeight: 600,
              cursor: busy || !file ? "not-allowed" : "pointer",
              opacity: busy || !file ? 0.5 : 1,
            }}
          >
            {busy ? "Processing…" : "Upload & process"}
          </button>
        </div>
        {error ? (
          <p style={{ color: "#f87171", marginTop: "0.75rem", marginBottom: 0 }}>
            {error}
          </p>
        ) : null}
      </div>

      {qc ? (
        <div className="card">
          <strong>QC result</strong>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            Job <code>{jobId}</code> · {qc.meter} · {qc.status} · {qc.increment}
          </p>
          <table className="releases">
            <tbody>
              <tr>
                <th>File</th>
                <td>{qc.filename}</td>
              </tr>
              <tr>
                <th>True peak (before)</th>
                <td>{fmtTp(beforeTp)}</td>
              </tr>
              <tr>
                <th>True peak (after)</th>
                <td>{fmtTp(afterTp)}</td>
              </tr>
              <tr>
                <th>Gate input (TP ≤ {qc.gate_dbtp} dBTP)</th>
                <td>{fmtGate(qc.input?.gate_pass ?? qc.gate_pass)}</td>
              </tr>
              <tr>
                <th>Gate output</th>
                <td>{fmtGate(qc.output?.gate_pass ?? null)}</td>
              </tr>
              <tr>
                <th>Master</th>
                <td>
                  {qc.master
                    ? `${qc.master.method}${qc.master.applied ? " (applied)" : ""}`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>Integrated LUFS (input)</th>
                <td>
                  {qc.input?.loudness_lufs != null
                    ? `${qc.input.loudness_lufs} LUFS`
                    : qc.loudness_lufs != null
                      ? `${qc.loudness_lufs} LUFS`
                      : "—"}
                </td>
              </tr>
              <tr>
                <th>Integrated LUFS (output)</th>
                <td>
                  {qc.output?.loudness_lufs != null
                    ? `${qc.output.loudness_lufs} LUFS`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>LRA (input)</th>
                <td>{qc.input?.lra ?? qc.lra ?? "—"}</td>
              </tr>
              {qc.probe ? (
                <tr>
                  <th>Probe</th>
                  <td>
                    {qc.probe.codec_name || "?"} / {qc.probe.sample_rate_hz || "?"}{" "}
                    Hz / ch={qc.probe.channels ?? "?"}
                    {qc.probe.duration_sec != null
                      ? ` / ${qc.probe.duration_sec.toFixed(1)} s`
                      : ""}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {qc.note}
          </p>
          {jobId ? (
            <p style={{ marginBottom: 0, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <a href={`/api/studio/jobs/${jobId}/download?file=qc.json`}>
                Download qc.json
              </a>
              {hasOutput ? (
                <a href={`/api/studio/jobs/${jobId}/download?file=output.wav`}>
                  Download output.wav
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
