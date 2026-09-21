'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import remarkImageSize from '@/lib/remarkImageSize';
import rehypeHighlight from 'rehype-highlight';

type Category = 'projects' | 'standard';

type BlogPost = {
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

const EMPTY_POST: BlogPost = {
  slug: '',
  category: 'standard',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  tags: [],
  excerpt: '',
  content: '',
  image: '',
  projectTitle: '',
  projectDescription: '',
  projectImage: '',
  externalUrl: '',
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [saveError, setSaveError] = useState('');

  const refreshPosts = () => {
    fetch('/api/admin/posts')
      .then((res) => {
        if (res.status === 401) {
          setLoggedIn(false);
          return [];
        }
        return res.json();
      })
      .then(setPosts);
  };

  useEffect(() => {
    if (loggedIn) refreshPosts();
  }, [loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setLoggedIn(true);
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setLoggedIn(false);
    setEditing(null);
    setPosts([]);
  };

  const startNewPost = () => {
    setEditing({ ...EMPTY_POST });
    setTagsInput('');
    setSaveError('');
  };

  const startEditPost = (post: BlogPost) => {
    setEditing({ ...post });
    setTagsInput(post.tags.join(', '));
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaveError('');

    const payload: BlogPost = {
      ...editing,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };

    const isNew = !posts.some((p) => p.slug === editing.slug);
    const url = isNew ? '/api/admin/posts' : `/api/admin/posts/${editing.slug}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? 'Failed to save post.');
      return;
    }

    setEditing(null);
    refreshPosts();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete post "${slug}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' });
    refreshPosts();
  };

  // --- LOGIN SCREEN ---
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.03] p-8"
        >
          <h1 className="text-white text-2xl font-semibold mb-6">Admin Login</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/40 text-sm mb-3 focus:outline-none focus:border-white/40"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/40 text-sm mb-4 focus:outline-none focus:border-white/40"
          />

          {loginError && <p className="text-red-400 text-sm mb-4">{loginError}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black font-semibold py-2 text-sm hover:bg-white/90 transition-colors"
          >
            Log in
          </button>
        </form>
      </div>
    );
  }

  // --- POST EDITOR ---
  if (editing) {
    return (
      <div className="h-full flex flex-col bg-black px-6 py-10">
        <div className="
            w-full min-h-0 overflow-y-auto bg-black px-6 py-16 justify-center
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/20
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-white/30
            [scrollbar-width:thin]
            [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white text-xl font-semibold">
              {posts.some((p) => p.slug === editing.slug) ? 'Edit Post' : 'New Post'}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                className="text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg border border-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-black bg-white hover:bg-white/90 text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>

          {saveError && <p className="text-red-400 text-sm mb-4">{saveError}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- FORM / EDITOR SIDE --- */}
            <div className="flex flex-col gap-3">
              <Field label="Slug (unique, URL-safe)">
                <input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className={inputClass}
                  placeholder="my-post-slug"
                />
              </Field>

              <Field label="Category">
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as Category })}
                  className={inputClass}
                >
                  <option value="standard">standard</option>
                  <option value="projects">projects</option>
                </select>
              </Field>

              <Field label="Title">
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Tags (comma-separated)">
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={inputClass}
                  placeholder="engineering, startups"
                />
              </Field>

              <Field label="Excerpt (plain text, shown in list view)">
                <textarea
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className={`${inputClass} h-16 resize-none`}
                />
              </Field>

              <Field label="Cover image URL">
                <input
                  value={editing.image ?? ''}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  className={inputClass}
                />
              </Field>

              {editing.category === 'projects' && (
                <>
                  <div className="border-t border-white/10 my-2 pt-3">
                    <p className="text-white/40 text-xs uppercase tracking-wide mb-3">
                      Project card fields
                    </p>
                  </div>

                  <Field label="Project title (defaults to Title if blank)">
                    <input
                      value={editing.projectTitle ?? ''}
                      onChange={(e) => setEditing({ ...editing, projectTitle: e.target.value })}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Project description (defaults to Excerpt if blank)">
                    <input
                      value={editing.projectDescription ?? ''}
                      onChange={(e) => setEditing({ ...editing, projectDescription: e.target.value })}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Project card image URL (defaults to Cover image if blank)">
                    <input
                      value={editing.projectImage ?? ''}
                      onChange={(e) => setEditing({ ...editing, projectImage: e.target.value })}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="External URL (if set, card links out instead of to this post)">
                    <input
                      value={editing.externalUrl ?? ''}
                      onChange={(e) => setEditing({ ...editing, externalUrl: e.target.value })}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </Field>
                </>
              )}

              <Field label="Content (Markdown — supports images, $LaTeX$, ```code```)">
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className={`${inputClass} h-96 font-mono text-sm resize-y`}
                />
              </Field>
            </div>

            {/* --- LIVE PREVIEW SIDE --- */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Preview</p>
              <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-6 sticky top-6 max-h-[85vh] overflow-y-auto">
                <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
                  {editing.date}
                </p>
                <h1 className="text-white text-2xl font-semibold mb-3">
                  {editing.title || 'Untitled Post'}
                </h1>
                <div className="flex flex-wrap gap-2 mb-6">
                  {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] uppercase tracking-wide text-white/60 border border-white/15 rounded-full px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath, remarkImageSize]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={markdownComponents}
                >
                {editing.content || '*Nothing to preview yet – start typing.*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- POST LIST ---
  return (
    <div className="min-h-screen bg-black px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-semibold">Admin — Posts</h1>
          <div className="flex gap-3">
            <button
              onClick={startNewPost}
              className="text-black bg-white hover:bg-white/90 text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + New Post
            </button>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg border border-white/15"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {posts.length === 0 && <p className="text-white/40 text-sm">No posts yet.</p>}

          {posts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.03] px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white font-semibold">{post.title}</h2>
                  <span className="text-[10px] uppercase tracking-wide text-white/50 border border-white/15 rounded-full px-2 py-0.5">
                    {post.category}
                  </span>
                </div>
                <p className="text-white/40 text-xs">{post.slug} · {post.date}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEditPost(post)}
                  className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-white/15"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.slug)}
                  className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg border border-red-400/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-xs mb-1">{label}</label>
      {children}
    </div>
  );
}

const markdownComponents = {
  h1: (props: any) => <h2 className="text-white text-2xl font-semibold mt-8 mb-3" {...props} />,
  h2: (props: any) => <h3 className="text-white text-xl font-semibold mt-8 mb-3" {...props} />,
  h3: (props: any) => <h4 className="text-white text-lg font-semibold mt-6 mb-2" {...props} />,
  p: (props: any) => <p className="text-white/80 leading-relaxed text-base mb-4" {...props} />,
  a: (props: any) => (
    <a className="text-white underline hover:text-white/70 transition-colors" target="_blank" rel="noreferrer" {...props} />
  ),
  img: (props: any) => {
    const { width, height, ...rest } = props;
    const hasExplicitSize = width || height;
    return (
      <img
        width={width}
        height={height}
        loading="lazy"
        className={
          hasExplicitSize
            ? 'rounded-2xl border border-white/10 my-6 mx-auto'
            : 'w-full max-h-[500px] object-contain rounded-2xl border border-white/10 my-6 mx-auto'
        }
        {...rest}
      />
    );
  },
  ul: (props: any) => <ul className="list-disc list-inside text-white/80 mb-4 space-y-1" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside text-white/80 mb-4 space-y-1" {...props} />,
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-2 border-white/20 pl-4 italic text-white/60 my-4" {...props} />
  ),
  code: (props: any) => {
    const { className, children, ...rest } = props;
    const isBlock = className?.includes('hljs') || className?.includes('language-');
    return isBlock ? (
      <code className={className} {...rest}>{children}</code>
    ) : (
      <code className="bg-white/10 text-white/90 rounded px-1.5 py-0.5 text-sm" {...rest}>
        {children}
      </code>
    );
  },
  pre: (props: any) => (
    <pre className="rounded-xl border border-white/10 p-4 overflow-x-auto text-sm mb-4" {...props} />
  ),
  strong: (props: any) => <strong className="text-white font-semibold" {...props} />,
  hr: (props: any) => <hr className="border-white/10 my-8" {...props} />,
};