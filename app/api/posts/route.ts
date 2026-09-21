import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/posts';

export async function GET() {
  return NextResponse.json(getAllPosts());
}

export async function POST(req: Request) {
  const body = await req.json();
  createPost(body);
  return NextResponse.json({ ok: true });
}