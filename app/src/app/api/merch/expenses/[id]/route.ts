import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  name: z.string().trim().nullable().optional(),
  expenseType: z.string().trim().nullable().optional(),
  date: z.string().trim().nullable().optional(),
  occasion: z.string().trim().nullable().optional(),
  event: z.string().trim().nullable().optional(),
  amount: z.number().nonnegative().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const item = await repo.updateMerchExtraExpense(params.id, patch);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo gasto extra de merch',
      entity: 'merch-gasto',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/merch/expenses PATCH]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo actualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteMerchExtraExpense(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino gasto extra de merch',
      entity: 'merch-gasto',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/merch/expenses DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
