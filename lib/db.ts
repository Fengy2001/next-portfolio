import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'blog.db');

const globalForDb = globalThis as unknown as { db?: Database.Database };

let initialized = false;

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      category TEXT NOT NULL CHECK (category IN ('projects', 'standard')),
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      image TEXT,
      project_title TEXT,
      project_description TEXT,
      project_image TEXT,
      external_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// lazily create the connection on first actual use, not on import —
// prevents native module side effects from running during `next build`'s
// static analysis / page-data-collection phase
export function getDb(): Database.Database {
  if (!globalForDb.db) {
    globalForDb.db = new Database(DB_PATH);
  }
  if (!initialized) {
    initSchema(globalForDb.db);
    initialized = true;
  }
  return globalForDb.db;
}