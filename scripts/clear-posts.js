// scripts/clear-posts.js
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'blog.db');
const db = new Database(DB_PATH);

const before = db.prepare('SELECT COUNT(*) AS count FROM posts').get();
console.log(`Found ${before.count} post(s) in the database.`);

db.prepare('DELETE FROM posts').run();

const after = db.prepare('SELECT COUNT(*) AS count FROM posts').get();
console.log(`Deleted. ${after.count} post(s) remaining.`);

db.close();