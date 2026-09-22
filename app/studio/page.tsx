"use client";

import { useCallback, useState } from "react";

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
  probe?: {
    codec_name: string | null;
    sample_rate_hz: number | null;
    channels: number | null;
    duration_sec: number | null;
  } | null;
};

export default function StudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qc, setQc] = useState<Qc | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const onUpload = useCallback(async () => {
    if (!file) {
      setError("Choose a WAV file first");
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
        setError(data.qc?.error || data.error || "measure failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [file]);

  return (
    <main className="admin-shell">
      <span className="badge">Studio · measure only</span>
      <h1>Recording studio</h1>
      <p className="muted">
        Upload a WAV → ffmpeg ebur128 QC (integrated LUFS + true peak). Gate TP ≤ −1.0
        dBTP. Increment 1 is measure-only — no alimiter / no mastered WAV yet.
      </p>
      <div className="nav">
        <a href="/">← Home</a>
        <a href="/admin">Admin CRM</a>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <strong>Upload WAV</strong>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Preferred format for v0. FLAC/AIFF later.
        </p>
        <input
          type="file"
          accept=".wav,audio/wav,audio/x-wav"
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
            {busy ? "Measuring…" : "Upload & measure"}
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
            Job <code>{jobId}</code> · {qc.meter} · {qc.status}
          </p>
          <table className="releases">
            <tbody>
              <tr>
                <th>File</th>
                <td>{qc.filename}</td>
              </tr>
              <tr>
                <th>Integrated LUFS</th>
                <td>
                  {qc.loudness_lufs != null ? `${qc.loudness_lufs} LUFS` : "—"}
                </td>
              </tr>
              <tr>
                <th>True peak</th>
                <td>
                  {qc.true_peak_dbtp != null
                    ? `${qc.true_peak_dbtp} dBTP`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>LRA</th>
                <td>{qc.lra != null ? qc.lra : "—"}</td>
              </tr>
              <tr>
                <th>Gate (TP ≤ {qc.gate_dbtp} dBTP)</th>
                <td>
                  {qc.gate_pass == null
                    ? "—"
                    : qc.gate_pass
                      ? "PASS"
                      : "FAIL (over gate)"}
                </td>
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
            <p style={{ marginBottom: 0 }}>
              <a href={`/api/studio/jobs/${jobId}/download`}>Download qc.json</a>
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
