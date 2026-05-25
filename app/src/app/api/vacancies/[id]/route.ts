import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import {
  AREAS,
  MODALIDADES,
  PRIORITIES,
  VACANCY_STATUSES,
} from '@/lib/types';

export const runtime = 'nodejs';

const patchSchema = z.object({
  title: z.string().optional(),
  area: z.enum(AREAS as unknown as [string, ...string[]]).optional(),
  seniority: z.string().optional(),
  recruiter: z.string().optional(),
  hiringManager: z.string().optional(),
  positions: z.number().int().min(1).optional(),
  status: z
    .enum(VACANCY_STATUSES as unknown as [string, ...string[]])
    .optional(),
  priority: z.enum(PRIORITIES as unknown as [string, ...string[]]).optional(),
  modalidad: z
    .enum(MODALIDADES as unknown as [string, ...string[]])
    .optional(),
  closedAt: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

  try {
    const repo = await getRepo();
    const v = await repo.updateVacancy(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo una vacante',
      entity: 'vacante',
      entityId: v.id,
    });
    return NextResponse.json({ data: v });
  } catch (err: any) {
    console.error('[api/vacancies PATCH]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo actualizar la vacante' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const repo = await getRepo();
  await repo.deleteVacancy(params.id);
  return NextResponse.json({ ok: true });
}
