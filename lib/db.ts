import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'blog.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const globalForDb = globalThis as unknown as { db?: DatabaseSync };
let initialized = false;

function initSchema(database: DatabaseSync) {
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

export function getDb(): DatabaseSync {
  if (!globalForDb.db) {
    globalForDb.db = new DatabaseSync(DB_PATH);
  }
  if (!initialized) {
    initSchema(globalForDb.db);
    initialized = true;
  }
  return globalForDb.db;
}