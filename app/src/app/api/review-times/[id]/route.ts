import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  candidateId: z.string().trim().min(1).optional(),
  headName: z.string().trim().min(1).optional(),
  cvSentAt: z.string().nullable().optional(),
  returnedAt: z.string().nullable().optional(),
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

  if (
    parsed.data.cvSentAt &&
    parsed.data.returnedAt &&
    parsed.data.returnedAt < parsed.data.cvSentAt
  ) {
    return NextResponse.json(
      { error: 'La fecha de retorno no puede ser anterior al envío' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const item = await repo.updateReviewTime(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo tiempo de revision',
      entity: 'revision',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/review-times PATCH]', err);
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
    await repo.deleteReviewTime(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino tiempo de revision',
      entity: 'revision',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/review-times DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
