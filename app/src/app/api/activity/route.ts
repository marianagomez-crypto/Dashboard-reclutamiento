import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const repo = await getRepo();
  const list = await repo.listActivity(100);
  return NextResponse.json({ data: list });
}
