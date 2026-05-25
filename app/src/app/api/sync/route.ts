import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

// Sincronizacion manual con Airtable: verifica conexion, invalida caches
// de todas las rutas del dashboard para que el siguiente render traiga
// data fresca desde Airtable, y registra el evento.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const repo = await getRepo();
  const health = await repo.health();

  // Invalida el cache de todas las rutas anidadas bajo /dashboard,
  // para que el router.refresh() del cliente fuerce SSR fresco.
  revalidatePath('/dashboard', 'layout');

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
