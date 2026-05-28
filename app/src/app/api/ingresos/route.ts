import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const createSchema = z.object({
  candidateId: z.string().trim().min(1, 'Candidato requerido'),
  finalSalary: z.number().nonnegative().optional(),
  startDate: z.string().trim().min(1, 'Fecha de ingreso requerida'),
  stillEmployed: z.boolean().nullable().optional(),
  endDate: z.string().nullable().optional(),
  passedProbation: z.boolean().nullable().optional(),
  performance: z.string().nullable().optional(),
  leaderComment: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listIngresos();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/ingresos GET]', err);
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

  try {
    const repo = await getRepo();
    const item = await repo.createIngreso(parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo ingreso',
      entity: 'ingreso',
      entityId: item.id,
      detail: item.candidateId,
    });
    // Invalida el SSR de la pagina para que el chart de comparacion se refresque
    revalidatePath('/dashboard/rango-salarial');
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/ingresos POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
