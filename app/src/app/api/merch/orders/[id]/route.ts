import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  orderId: z.string().trim().min(1).optional(),
  purchaseDate: z.string().trim().nullable().optional(),
  productType: z.string().trim().min(1).optional(),
  article: z.string().trim().min(1).optional(),
  photoUrl: z.string().trim().nullable().optional(),
  unitPrice: z.number().nonnegative().nullable().optional(),
  qtyOrdered: z.number().nonnegative().nullable().optional(),
  totalPrice: z.number().nonnegative().nullable().optional(),
  qtyArrived: z.number().nonnegative().nullable().optional(),
  qtyRemaining: z.number().nullable().optional(),
  endDate: z.string().trim().nullable().optional(),
  supplier: z.string().trim().nullable().optional(),
  contact: z.string().trim().nullable().optional(),
  comments: z.string().trim().nullable().optional(),
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

  // Normaliza null -> undefined para los campos opcionales.
  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    patch[k] = v === null ? undefined : v;
  }

  try {
    const repo = await getRepo();
    const item = await repo.updatePurchaseOrder(params.id, patch);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo orden de compra',
      entity: 'merch-orden',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/merch/orders PATCH]', err);
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
    await repo.deletePurchaseOrder(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino orden de compra',
      entity: 'merch-orden',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/merch/orders DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
