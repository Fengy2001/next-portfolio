import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'blog.db');

// cache the connection across hot-reloads in dev
const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    slug TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('projects', 'standard')),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',        -- stored as JSON string
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
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);