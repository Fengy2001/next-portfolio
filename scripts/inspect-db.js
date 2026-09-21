const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'blog.db'));

const rows = db.prepare('SELECT slug, category, title FROM posts').all();

console.log(`Found ${rows.length} post(s):`);
console.table(rows);

db.close();