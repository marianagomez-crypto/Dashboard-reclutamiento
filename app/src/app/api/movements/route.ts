import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import { STAGES } from '@/lib/types';

export const runtime = 'nodejs';

const ETAPA_RESULTADOS = ['Aprobado', 'Aceptó Oferta', 'No se presentó'] as const;

const createSchema = z.object({
  id: z.string().optional(),
  candidateId: z.string().min(1, 'ID Candidato requerido'),
  vacancyId: z.string().min(1, 'ID Vacante requerido'),
  stage: z.enum(STAGES as unknown as [string, ...string[]]),
  startedAt: z.string().min(1, 'Fecha Inicio requerida'),
  endedAt: z.string().optional().nullable(),
  result: z.enum(ETAPA_RESULTADOS as unknown as [string, ...string[]]).optional().nullable(),
  comments: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const repo = await getRepo();
  const candidateId = req.nextUrl.searchParams.get('candidateId') || undefined;
  const list = await repo.listStageMovements(candidateId);
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
    const m = await repo.createStageMovement(parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo un movimiento',
      entity: 'etapa',
      entityId: m.id,
      detail: `${m.candidateId} -> ${m.stage}`,
    });
    return NextResponse.json({ data: m }, { status: 201 });
  } catch (err: any) {
    console.error('[api/movements POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear el movimiento' },
      { status: 500 },
    );
  }
}
