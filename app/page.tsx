export default function HomePage() {
  return (
    <main className="hero">
      <span className="badge">Local skeleton</span>
      <h1>CORE64 Records — First AI Music Label</h1>
      <p>
        Public site shell for the First AI Music Label. Admin CRM lives at{" "}
        <a href="/admin">/admin</a>. Coolify-ready DF; deploy waits on
        GitHub repo, DNS for records.core64.studio, and Coolify UI login.
      </p>
      <div className="nav">
        <a href="/">Home</a>
        <a href="/admin">Admin CRM</a>
      </div>
      <div className="card">
        <strong>MVP</strong>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Site + CRM (SQLite). Separate from core64.studio landing, suno stacks,
          and factory packaging. No Redis/Postgres/OpenHands day-1.
        </p>
      </div>
    </main>
  );
}
