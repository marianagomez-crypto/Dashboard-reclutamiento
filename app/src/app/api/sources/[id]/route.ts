import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  vacancyId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  monthlyCost: z.number().nonnegative().nullable().optional(),
  owner: z.string().nullable().optional(),
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

  try {
    const repo = await getRepo();
    const item = await repo.updateSource(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo fuente',
      entity: 'fuente',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/sources PATCH]', err);
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
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteSource(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino fuente',
      entity: 'fuente',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/sources DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
