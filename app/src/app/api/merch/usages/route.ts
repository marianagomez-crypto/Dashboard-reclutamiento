import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const usageSchema = z.object({
  usageDate: z.string().trim().nullable().optional(),
  orderId: z.string().trim().min(1, 'ID compra requerido'),
  quantity: z.number().nonnegative().nullable().optional(),
  unitPrice: z.number().nonnegative().nullable().optional(),
  totalAmount: z.number().nonnegative().nullable().optional(),
  occasion: z.string().trim().nullable().optional(),
  comments: z.string().trim().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listMerchUsages();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/merch/usages GET]', err);
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
  const parsed = usageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const d = parsed.data;
    const item = await repo.createMerchUsage({
      usageDate: d.usageDate || undefined,
      orderId: d.orderId,
      quantity: d.quantity ?? undefined,
      unitPrice: d.unitPrice ?? undefined,
      totalAmount: d.totalAmount ?? undefined,
      occasion: d.occasion || undefined,
      comments: d.comments || undefined,
    });
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo uso de merch',
      entity: 'merch-uso',
      entityId: item.id,
      detail: `${item.orderId} · ${item.quantity ?? ''}`,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/merch/usages POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
