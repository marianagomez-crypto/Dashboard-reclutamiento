import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import {
  AREAS,
  HIRING_MANAGERS,
  MODALIDADES,
  PRIORITIES,
  RECRUITERS,
  VACANCY_STATUSES,
} from '@/lib/types';

export const runtime = 'nodejs';

const createSchema = z.object({
  title: z.string().min(2),
  area: z.enum(AREAS as unknown as [string, ...string[]]),
  seniority: z.string().optional(),
  recruiter: z
    .enum(RECRUITERS as unknown as [string, ...string[]])
    .optional(),
  hiringManager: z
    .enum(HIRING_MANAGERS as unknown as [string, ...string[]])
    .optional(),
  positions: z.number().int().min(1).default(1),
  status: z
    .enum(VACANCY_STATUSES as unknown as [string, ...string[]])
    .default('Abierta'),
  priority: z.enum(PRIORITIES as unknown as [string, ...string[]]).default('Media'),
  modalidad: z
    .enum(MODALIDADES as unknown as [string, ...string[]])
    .optional(),
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const repo = await getRepo();
  const list = await repo.listVacancies({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    area: url.searchParams.get('area') || undefined,
    priority: url.searchParams.get('priority') || undefined,
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
  const v = await repo.createVacancy(parsed.data as any);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'creo una vacante',
    entity: 'vacante',
    entityId: v.id,
    detail: v.title,
  });
  return NextResponse.json({ data: v }, { status: 201 });
}
