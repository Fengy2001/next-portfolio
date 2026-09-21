const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'blog.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Admin username: ', (username) => {
  rl.question('Admin password: ', (password) => {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash'
    ).run(username, hash);
    console.log(`Admin user "${username}" created/updated.`);
    db.close();
    rl.close();
  });
});