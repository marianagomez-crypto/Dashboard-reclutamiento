import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const createSchema = z.object({
  candidateId: z.string().trim().min(1, 'Candidato requerido'),
  headName: z.string().trim().min(1, 'Hiring Manager requerido'),
  cvSentAt: z.string().nullable().optional(),
  returnedAt: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listReviewTimes();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/review-times GET]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo listar' },
      { status: 500 },
    );
  }
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

  // Si vienen ambas fechas, retorno no puede ser antes del envío
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
    const item = await repo.createReviewTime(parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo tiempo de revision',
      entity: 'revision',
      entityId: item.id,
      detail: `${item.candidateId} · ${item.headName}`,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/review-times POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
