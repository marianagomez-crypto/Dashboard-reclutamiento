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

const createSchema = z.object({
  title: z.string().min(2),
  area: z.enum(AREAS as unknown as [string, ...string[]]),
  seniority: z.string().optional(),
  // Recruiter y Hiring Manager se validan desde catalogos en Airtable
  // (tablas Reclutadores / Hiring Managers), no contra enum hardcoded.
  recruiter: z.string().optional(),
  hiringManager: z.string().optional(),
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
  try {
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
  } catch (err: any) {
    console.error('[api/vacancies POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear la vacante' },
      { status: 500 },
    );
  }
}
