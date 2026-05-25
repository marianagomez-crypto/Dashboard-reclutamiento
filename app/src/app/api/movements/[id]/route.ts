import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import { STAGES } from '@/lib/types';

export const runtime = 'nodejs';

const ETAPA_RESULTADOS = ['Aprobado', 'Aceptó Oferta', 'No se presentó'] as const;

const patchSchema = z.object({
  candidateId: z.string().optional(),
  vacancyId: z.string().optional(),
  stage: z.enum(STAGES as unknown as [string, ...string[]]).optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().nullable().optional(),
  result: z.enum(ETAPA_RESULTADOS as unknown as [string, ...string[]]).nullable().optional(),
  comments: z.string().nullable().optional(),
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
    const m = await repo.updateStageMovement(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo un movimiento',
      entity: 'etapa',
      entityId: m.id,
    });
    return NextResponse.json({ data: m });
  } catch (err: any) {
    console.error('[api/movements PATCH]', err);
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
  if (session.role !== 'admin' && session.role !== 'recruiter')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteStageMovement(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino un movimiento',
      entity: 'etapa',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/movements DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
