import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';

export const runtime = 'nodejs';

export async function GET() {
  const repo = await getRepo();
  const health = await repo.health();
  return NextResponse.json({ ...health, source: repo.source() });
}
