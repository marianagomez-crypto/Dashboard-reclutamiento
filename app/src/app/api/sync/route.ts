import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

// Sincronizacion manual con Airtable: hace ping y registra evento.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const repo = await getRepo();
  const health = await repo.health();
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'sincronizo con Airtable',
    entity: 'sistema',
    detail: health.ok ? 'OK' : health.detail,
  });
  await repo.pushNotification({
    title: health.ok ? 'Sincronizacion exitosa' : 'Error de sincronizacion',
    body: health.ok ? 'Datos al dia con Airtable.' : health.detail,
    type: health.ok ? 'success' : 'error',
  });
  return NextResponse.json({ ...health, source: repo.source() });
}
