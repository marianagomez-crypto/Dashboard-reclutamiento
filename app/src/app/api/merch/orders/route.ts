import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const orderSchema = z.object({
  orderId: z.string().trim().optional(),
  purchaseDate: z.string().trim().nullable().optional(),
  productType: z.string().trim().min(1, 'Tipo de producto requerido'),
  article: z.string().trim().min(1, 'Artículo requerido'),
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

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listPurchaseOrders();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/merch/orders GET]', err);
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
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const d = parsed.data;
    const item = await repo.createPurchaseOrder({
      orderId: d.orderId || '',
      purchaseDate: d.purchaseDate || undefined,
      productType: d.productType,
      article: d.article,
      photoUrl: d.photoUrl || undefined,
      unitPrice: d.unitPrice ?? undefined,
      qtyOrdered: d.qtyOrdered ?? undefined,
      totalPrice: d.totalPrice ?? undefined,
      qtyArrived: d.qtyArrived ?? undefined,
      qtyRemaining: d.qtyRemaining ?? undefined,
      endDate: d.endDate || undefined,
      supplier: d.supplier || undefined,
      contact: d.contact || undefined,
      comments: d.comments || undefined,
    });
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo orden de compra',
      entity: 'merch-orden',
      entityId: item.id,
      detail: `${item.orderId} · ${item.article}`,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/merch/orders POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
