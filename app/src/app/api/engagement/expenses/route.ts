import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const schema = z.object({
  eventId: z.string().trim().min(1, 'Evento requerido'),
  eventName: z.string().trim().nullable().optional(),
  month: z.string().trim().min(1, 'Mes requerido'),
  name: z.string().trim().min(1, 'Nombre requerido'),
  amount: z.number().nonnegative().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listEngagementExpenses();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/engagement/expenses GET]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo listar' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const d = parsed.data;
    const item = await repo.createEngagementExpense({
      eventId: d.eventId,
      eventName: d.eventName || undefined,
      month: d.month,
      name: d.name,
      amount: d.amount ?? undefined,
    });
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo gasto de evento',
      entity: 'engagement-gasto',
      entityId: item.id,
      detail: `${item.name} · ${item.amount ?? ''}`,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/engagement/expenses POST]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo crear' }, { status: 500 });
  }
}
