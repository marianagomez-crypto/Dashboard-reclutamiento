import { NextRequest, NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteEngagementGastoEvento(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino evento de gastos',
      entity: 'engagement-gasto-evento',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/engagement/gasto-eventos DELETE]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo eliminar' }, { status: 500 });
  }
}
