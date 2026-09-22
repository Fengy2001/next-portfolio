// scripts/clear-posts.js
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'data', 'blog.db');
const db = new DatabaseSync(DB_PATH);

const before = db.prepare('SELECT COUNT(*) AS count FROM posts').get();
console.log(`Found ${before.count} post(s) in the database.`);

db.prepare('DELETE FROM posts').run();

const after = db.prepare('SELECT COUNT(*) AS count FROM posts').get();
console.log(`Deleted. ${after.count} post(s) remaining.`);

db.close();