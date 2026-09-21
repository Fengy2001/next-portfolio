import { NextResponse } from 'next/server';
import { getPostBySlug, updatePost, deletePost } from '@/lib/posts';
import { PostSchema } from '@/lib/validation';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();
  const parsed = PostSchema.partial().safeParse(body); // .partial() allows partial updates

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    updatePost(slug, parsed.data as any);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  deletePost(slug);
  return NextResponse.json({ ok: true });
}