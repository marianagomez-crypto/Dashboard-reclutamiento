import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  eventId: z.string().trim().min(1).optional(),
  eventName: z.string().trim().nullable().optional(),
  month: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  amount: z.number().nonnegative().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    patch[k] = v === null ? undefined : v;
  }

  try {
    const repo = await getRepo();
    const item = await repo.updateEngagementExpense(params.id, patch);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo gasto de evento',
      entity: 'engagement-gasto',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/engagement/expenses PATCH]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteEngagementExpense(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino gasto de evento',
      entity: 'engagement-gasto',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/engagement/expenses DELETE]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo eliminar' }, { status: 500 });
  }
}
