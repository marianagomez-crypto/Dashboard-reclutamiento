import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import {
  DROP_REASONS,
  FINAL_STATUSES,
  FUENTES,
  RECRUITERS,
  STAGES,
} from '@/lib/types';

export const runtime = 'nodejs';

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  vacancyId: z.string().optional(),
  source: z.enum(FUENTES as unknown as [string, ...string[]]).optional(),
  recruiter: z.enum(RECRUITERS as unknown as [string, ...string[]]).optional(),
  stage: z.enum(STAGES as unknown as [string, ...string[]]).optional(),
  finalStatus: z
    .enum(FINAL_STATUSES as unknown as [string, ...string[]])
    .optional(),
  dropReason: z
    .enum(DROP_REASONS as unknown as [string, ...string[]])
    .nullable()
    .optional(),
  hired: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const repo = await getRepo();
  const c = await repo.getCandidate(params.id);
  if (!c) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: c });
}

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
  const repo = await getRepo();
  const c = await repo.updateCandidate(params.id, parsed.data as any);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'actualizo un candidato',
    entity: 'candidato',
    entityId: c.id,
    detail: parsed.data.stage ? `etapa -> ${parsed.data.stage}` : undefined,
  });
  return NextResponse.json({ data: c });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const repo = await getRepo();
  await repo.deleteCandidate(params.id);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'elimino un candidato',
    entity: 'candidato',
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
