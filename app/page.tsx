export default function HomePage() {
  return (
    <main className="hero">
      <span className="badge">Live</span>
      <h1>CORE64 Records — First AI Music Label</h1>
      <p>
        Live First AI Music Label site for CORE64 Records. Admin CRM lives at{" "}
        <a href="/admin">/admin</a>.
      </p>
      <div className="nav">
        <a href="/">Home</a>
        <a href="/admin">Admin CRM</a>
      </div>
      <div className="card">
        <strong>MVP</strong>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Site + CRM (SQLite) — honest CRM MVP. Separate from core64.studio
          landing, suno stacks, and factory packaging. No Redis/Postgres/OpenHands
          day-1. Auth and cover upload come in later increments.
        </p>
      </div>
    </main>
  );
}
