const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Database = require('better-sqlite3');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'blog-posts');
const DB_PATH = path.join(__dirname, '..', 'data', 'blog.db');

const db = new Database(DB_PATH);

// make sure the table exists, in case this runs before the app ever has
db.exec(`
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
`);

const upsert = db.prepare(`
  INSERT INTO posts (slug, category, title, date, tags, excerpt, content, image, project_title, project_description, project_image, external_url)
  VALUES (@slug, @category, @title, @date, @tags, @excerpt, @content, @image, @projectTitle, @projectDescription, @projectImage, @externalUrl)
  ON CONFLICT(slug) DO UPDATE SET
    category = excluded.category,
    title = excluded.title,
    date = excluded.date,
    tags = excluded.tags,
    excerpt = excluded.excerpt,
    content = excluded.content,
    image = excluded.image,
    project_title = excluded.project_title,
    project_description = excluded.project_description,
    project_image = excluded.project_image,
    external_url = excluded.external_url,
    updated_at = datetime('now')
`);

function findMarkdownFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findMarkdownFiles(POSTS_DIR);
console.log(`Found ${files.length} markdown file(s).`);

let inserted = 0;
let skipped = 0;

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  if (!data.slug || !data.category || !data.title || !data.date) {
    console.warn(`Skipping ${filePath} — missing required frontmatter (slug, category, title, date).`);
    skipped++;
    continue;
  }

  upsert.run({
    slug: data.slug,
    category: data.category,
    title: data.title,
    date: data.date,
    tags: JSON.stringify(data.tags ?? []),
    excerpt: data.excerpt ?? '',
    content: content.trim(),
    image: data.image ?? null,
    projectTitle: data.projectTitle ?? null,
    projectDescription: data.projectDescription ?? null,
    projectImage: data.projectImage ?? null,
    externalUrl: data.externalUrl ?? null,
  });

  console.log(`Seeded: ${data.slug}`);
  inserted++;
}

console.log(`\nDone. ${inserted} post(s) seeded/updated, ${skipped} skipped.`);
db.close();