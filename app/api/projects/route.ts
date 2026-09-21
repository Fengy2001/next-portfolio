import { NextResponse } from 'next/server';
import { getFeaturedProjects } from '@/lib/posts';

export async function GET() {
  return NextResponse.json(getFeaturedProjects());
}