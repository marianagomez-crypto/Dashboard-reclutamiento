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

const createSchema = z.object({
  name: z.string().min(2),
  vacancyId: z.string().optional(),
  source: z.enum(FUENTES as unknown as [string, ...string[]]),
  recruiter: z.enum(RECRUITERS as unknown as [string, ...string[]]).optional(),
  stage: z.enum(STAGES as unknown as [string, ...string[]]).default('Screening'),
  finalStatus: z
    .enum(FINAL_STATUSES as unknown as [string, ...string[]])
    .default('En proceso'),
  dropReason: z
    .enum(DROP_REASONS as unknown as [string, ...string[]])
    .optional(),
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const repo = await getRepo();
  const list = await repo.listCandidates({
    search: url.searchParams.get('search') || undefined,
    stage: url.searchParams.get('stage') || undefined,
    source: url.searchParams.get('source') || undefined,
    vacancyId: url.searchParams.get('vacancyId') || undefined,
    recruiter: url.searchParams.get('recruiter') || undefined,
    finalStatus: url.searchParams.get('finalStatus') || undefined,
  });
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }
  const repo = await getRepo();
  const c = await repo.createCandidate(parsed.data as any);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'creo un candidato',
    entity: 'candidato',
    entityId: c.id,
    detail: c.name,
  });
  await repo.pushNotification({
    title: 'Nuevo candidato',
    body: `${c.name} fue agregado al pipeline.`,
    type: 'success',
    href: '/dashboard/candidatos',
  });
  return NextResponse.json({ data: c }, { status: 201 });
}
