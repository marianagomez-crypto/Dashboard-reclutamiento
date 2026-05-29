import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';
import { isKvAvailable } from '@/lib/data/user-kv-store';

export const runtime = 'nodejs';

export async function GET() {
  const repo = await getRepo();
  const health = await repo.health();
  const kvEnabled = isKvAvailable();

  // Diagnostico: cuantos usuarios hay y donde se almacenan
  let userCount: number | null = null;
  try {
    const users = await repo.listUsers();
    userCount = users.length;
  } catch {
    userCount = null;
  }

  return NextResponse.json({
    ...health,
    source: repo.source(),
    auth: {
      // Si "kv" -> usuarios persisten en Upstash Redis (production-ready)
      // Si "memory" -> usuarios viven en memoria local (se pierden al cold start)
      storage: kvEnabled ? 'kv' : 'memory',
      userCount,
    },
  });
}
