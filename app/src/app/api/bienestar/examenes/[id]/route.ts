import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  collaboratorId: z.string().trim().min(1).optional(),
  collaboratorName: z.string().trim().min(1).optional(),
  examDate: z.string().trim().nullable().optional(),
  sede: z.string().trim().nullable().optional(),
  status: z.string().trim().nullable().optional(),
  resultado: z.string().trim().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
  for (const [k, v] of Object.entries(parsed.data)) patch[k] = v === null ? undefined : v;

  try {
    const repo = await getRepo();
    const item = await repo.updateMedicalExam(params.id, patch);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo examen medico',
      entity: 'bienestar-examen',
      entityId: item.id,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/bienestar/examenes PATCH]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteMedicalExam(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino examen medico',
      entity: 'bienestar-examen',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/bienestar/examenes DELETE]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo eliminar' }, { status: 500 });
  }
}
