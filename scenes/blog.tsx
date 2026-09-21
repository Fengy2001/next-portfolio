'use client';
import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import remarkImageSize from '@/lib/remarkImageSize';

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
  image?: string;
};


type Props = {
  posts?: BlogPost[];
  initialSlug?: string | null;
};

export default function Blog({ posts: propsPosts, initialSlug = null }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(propsPosts ?? []);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);

  useEffect(() => {
    if (propsPosts) return;
    fetch('/api/posts')
      .then((res) => res.json())
      .then(setPosts);
  }, [propsPosts]);

  useEffect(() => {
    setSelectedSlug(initialSlug);
  }, [initialSlug]);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [posts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [sorted, query]);

  const selectedPost = selectedSlug ? posts.find((p) => p.slug === selectedSlug) ?? null : null;


  if (selectedPost) {
    return (
      // h-screen + overflow-y-auto creates its own scroll container,
      // independent of whatever overflow rule is on html/body globally.
      <div className="w-full flex-1 min-h-0 overflow-y-auto bg-black px-6 py-16 flex justify-center
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-white/20
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-white/30
        [scrollbar-width:thin]
        [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
      >
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setSelectedSlug(null)}
            className="text-white/60 hover:text-white text-sm mb-8 inline-flex items-center gap-1"
          >
            ← Back to all posts
          </button>

          {selectedPost.image && (
            <img
              src={selectedPost.image}
              alt={selectedPost.title}
              className="w-full h-64 object-cover rounded-2xl mb-8 border border-white/10"
            />
          )}

          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
            {formatDate(selectedPost.date)}
          </p>
          <h1 className="text-white text-3xl md:text-4xl font-semibold mb-4">
            {selectedPost.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {selectedPost.tags.map((tag) => (
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
            {selectedPost.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto bg-black px-6 py-16 flex justify-center
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-white/20
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-white/30
      [scrollbar-width:thin]
      [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
    >
      <div className="w-full max-w-2xl">
        <h1 className="text-white text-3xl md:text-4xl font-semibold mb-2">Blog</h1>
        <p className="text-white/50 text-sm mb-8">
          A place for me to show off my projects/endavours while also show a little bit of my personality!
        </p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, tag, or keyword..."
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 text-sm mb-10 focus:outline-none focus:border-white/40 transition-colors"
        />

        <div className="flex flex-col gap-4">
          {filtered.length === 0 && (
            <p className="text-white/40 text-sm">No posts match your search.</p>
          )}

          {filtered.map((post) => (
            <button
              key={post.slug}
              onClick={() => setSelectedSlug(post.slug)}
              className="text-left rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-colors overflow-hidden flex gap-4 p-4"
            >
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-1">
                  {formatDate(post.date)}
                </p>
                <h2 className="text-white text-lg font-semibold mb-1 truncate">{post.title}</h2>
                <p className="text-white/60 text-sm leading-snug mb-2 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wide text-white/50 border border-white/10 rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}