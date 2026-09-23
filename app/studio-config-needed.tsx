export default function StudioConfigNeeded() {
  return (
    <main className="admin-shell">
      <span className="badge">CORE64 Records · Studio</span>
      <h1>Studio access not configured</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Set environment variable <code>STUDIO_ACCESS_PASSWORD</code> in Coolify for this
        application, then redeploy. The studio stays closed until that is set (fail-closed).
      </p>
      <p className="muted">
        Retention (once live): job files are deleted automatically after 24 hours.
      </p>
    </main>
  );
}
