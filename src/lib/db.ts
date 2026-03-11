import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "@/lib/logger";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "jobhunter.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(process.cwd(), "src", "lib", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = database
      .prepare("SELECT id FROM _migrations WHERE name = ?")
      .get(file);

    if (!applied) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      database.exec(sql);
      database.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
      logger.info("db", `Migration applied: ${file}`);
    }
  }
}
