"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudioLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `login failed (${res.status})`);
      }
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <span className="badge">CORE64 Records · Studio</span>
      <h1>Studio access</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Password required to use the mastering studio and APIs.
      </p>
      <p className="muted">
        Retention: job files are deleted automatically after 24 hours.
      </p>
      <div className="card" style={{ marginTop: "1.5rem", maxWidth: 420 }}>
        <form onSubmit={onSubmit}>
          <label htmlFor="studio-password" className="muted" style={{ display: "block" }}>
            Password
          </label>
          <input
            id="studio-password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--fg)",
            }}
          />
          <div style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={busy || !password}
              style={{
                background: "var(--accent)",
                color: "#0b0b0f",
                border: "none",
                borderRadius: 8,
                padding: "0.55rem 1rem",
                fontWeight: 600,
                cursor: busy || !password ? "not-allowed" : "pointer",
                opacity: busy || !password ? 0.5 : 1,
              }}
            >
              {busy ? "Checking…" : "Log in"}
            </button>
          </div>
          {error ? (
            <p style={{ color: "#f87171", marginTop: "0.75rem", marginBottom: 0 }}>
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
