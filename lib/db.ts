import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "crm.db");

export type ReleaseRow = {
  id: number;
  title: string;
  artist: string;
  visible: string;
  cover: string;
};

export function getDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      visible TEXT NOT NULL DEFAULT 'No',
      cover TEXT NOT NULL DEFAULT 'unknown'
    );
  `);
  return db;
}

export function listReleases(): ReleaseRow[] {
  const db = getDb();
  try {
    return db
      .prepare(
        "SELECT id, title, artist, visible, cover FROM releases ORDER BY id ASC"
      )
      .all() as ReleaseRow[];
  } finally {
    db.close();
  }
}
