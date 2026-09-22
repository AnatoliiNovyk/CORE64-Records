import { listReleases } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  let releases: ReturnType<typeof listReleases> = [];
  let dbError: string | null = null;
  try {
    releases = listReleases();
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="admin-shell">
      <span className="badge">CRM shell</span>
      <h1>Admin</h1>
      <p className="muted">
        SQLite CRM shell for releases. Visible gate / Cover Gate stay No / unknown
        until human GO. No Redis/Postgres/OpenHands.
      </p>
      <p className="muted">
        {releases.length} release{releases.length === 1 ? "" : "s"}
        {" · "}
        seeded if empty on first open
      </p>
      <div className="nav">
        <a href="/">← Studio</a>
      </div>

      {dbError ? (
        <div className="card">
          <strong>DB not ready</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Run <code>npm run db:init</code>. ({dbError})
          </p>
        </div>
      ) : (
        <table className="releases">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Visible</th>
              <th>Cover</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.artist}</td>
                <td>{r.visible}</td>
                <td>{r.cover}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="admin-grid">
        <div className="admin-tile">Releases — SQLite</div>
        <div className="admin-tile">Artists — stub</div>
        <div className="admin-tile">Covers / Cover Gate — stub</div>
        <div className="admin-tile">Visible gate — stub</div>
      </div>
    </main>
  );
}
