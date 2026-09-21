import { db } from './db';

export type Category = 'projects' | 'standard';

export type BlogPost = {
  slug: string;
  category: Category;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
  image?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectImage?: string;
  externalUrl?: string;
};

export type ProjectData = {
  title: string;
  description: string;
  image: string;
  blogSlug?: string;
  url?: string;
};

// raw DB row shape (snake_case columns) -> BlogPost (camelCase)
function rowToPost(row: any): BlogPost {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    date: row.date,
    tags: JSON.parse(row.tags),
    excerpt: row.excerpt,
    content: row.content,
    image: row.image ?? undefined,
    projectTitle: row.project_title ?? undefined,
    projectDescription: row.project_description ?? undefined,
    projectImage: row.project_image ?? undefined,
    externalUrl: row.external_url ?? undefined,
  };
}

export function getAllPosts(): BlogPost[] {
  const rows = db.prepare('SELECT * FROM posts ORDER BY date DESC').all();
  return rows.map(rowToPost);
}

export function getPostBySlug(slug: string): BlogPost | null {
  const row = db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug);
  return row ? rowToPost(row as any) : null;
}

export function getFeaturedProjects(): ProjectData[] {
  const rows = db.prepare(`SELECT * FROM posts WHERE category = 'projects'`).all();
  return rows.map(rowToPost).map((post) => ({
    title: post.projectTitle ?? post.title,
    description: post.projectDescription ?? post.excerpt,
    image: post.projectImage ?? post.image ?? '',
    ...(post.externalUrl ? { url: post.externalUrl } : { blogSlug: post.slug }),
  }));
}

// --- write operations, for live create/edit/delete ---

export function createPost(post: Omit<BlogPost, never>): void {
  db.prepare(`
    INSERT INTO posts (slug, category, title, date, tags, excerpt, content, image, project_title, project_description, project_image, external_url)
    VALUES (@slug, @category, @title, @date, @tags, @excerpt, @content, @image, @projectTitle, @projectDescription, @projectImage, @externalUrl)
  `).run({
    ...post,
    tags: JSON.stringify(post.tags),
    image: post.image ?? null,
    projectTitle: post.projectTitle ?? null,
    projectDescription: post.projectDescription ?? null,
    projectImage: post.projectImage ?? null,
    externalUrl: post.externalUrl ?? null,
  });
}

export function updatePost(slug: string, updates: Partial<BlogPost>): void {
  const existing = getPostBySlug(slug);
  if (!existing) throw new Error(`Post not found: ${slug}`);
  const merged = { ...existing, ...updates };

  db.prepare(`
    UPDATE posts SET
      category = @category,
      title = @title,
      date = @date,
      tags = @tags,
      excerpt = @excerpt,
      content = @content,
      image = @image,
      project_title = @projectTitle,
      project_description = @projectDescription,
      project_image = @projectImage,
      external_url = @externalUrl,
      updated_at = datetime('now')
    WHERE slug = @slug
  `).run({
    ...merged,
    tags: JSON.stringify(merged.tags),
    image: merged.image ?? null,
    projectTitle: merged.projectTitle ?? null,
    projectDescription: merged.projectDescription ?? null,
    projectImage: merged.projectImage ?? null,
    externalUrl: merged.externalUrl ?? null,
  });
}

export function deletePost(slug: string): void {
  db.prepare('DELETE FROM posts WHERE slug = ?').run(slug);
}