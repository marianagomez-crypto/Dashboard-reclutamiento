import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const expenseSchema = z.object({
  name: z.string().trim().nullable().optional(),
  expenseType: z.string().trim().nullable().optional(),
  date: z.string().trim().nullable().optional(),
  occasion: z.string().trim().nullable().optional(),
  event: z.string().trim().nullable().optional(),
  amount: z.number().nonnegative().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listMerchExtraExpenses();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/merch/expenses GET]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo listar' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const d = parsed.data;
    const item = await repo.createMerchExtraExpense({
      name: d.name || undefined,
      expenseType: d.expenseType || undefined,
      date: d.date || undefined,
      occasion: d.occasion || undefined,
      event: d.event || undefined,
      amount: d.amount ?? undefined,
    });
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo gasto extra de merch',
      entity: 'merch-gasto',
      entityId: item.id,
      detail: `${item.expenseType ?? ''} · ${item.amount ?? ''}`,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/merch/expenses POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
