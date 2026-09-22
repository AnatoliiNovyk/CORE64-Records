import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "crm.db");

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    visible TEXT NOT NULL DEFAULT 'No',
    cover TEXT NOT NULL DEFAULT 'unknown'
  );
`);

const count = db.prepare("SELECT COUNT(*) AS c FROM releases").get().c;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO releases (title, artist, visible, cover) VALUES (?, ?, ?, ?)"
  );
  insert.run("YIELD POINT", "CORE64", "No", "unknown");
  insert.run("BRITTLE", "CORE64", "No", "unknown");
  console.log("Seeded YIELD POINT / BRITTLE (Visible=No, cover=unknown)");
} else {
  console.log(`DB already has ${count} release(s); skip seed`);
}
db.close();
console.log("OK", dbPath);
