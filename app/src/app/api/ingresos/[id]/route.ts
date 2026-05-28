import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  candidateId: z.string().trim().min(1).optional(),
  finalSalary: z.number().nonnegative().nullable().optional(),
  startDate: z.string().optional(),
  stillEmployed: z.boolean().nullable().optional(),
  endDate: z.string().nullable().optional(),
  passedProbation: z.boolean().nullable().optional(),
  performance: z.string().nullable().optional(),
  leaderComment: z.string().nullable().optional(),
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
    const item = await repo.updateIngreso(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo ingreso',
      entity: 'ingreso',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/ingresos PATCH]', err);
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
    await repo.deleteIngreso(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino ingreso',
      entity: 'ingreso',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/ingresos DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
