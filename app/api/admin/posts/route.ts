import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/posts';
import { PostSchema } from '@/lib/validation';

export async function GET() {
  return NextResponse.json(getAllPosts());
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    createPost(parsed.data);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}