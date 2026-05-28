import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const createSchema = z.object({
  vacancyId: z.string().trim().min(1, 'Vacante requerida'),
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  status: z.string().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listSalaryRanges();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/salary-ranges GET]', err);
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

  // Validacion semantica: si vienen ambos, min <= max
  if (
    parsed.data.min !== undefined &&
    parsed.data.max !== undefined &&
    parsed.data.min > parsed.data.max
  ) {
    return NextResponse.json(
      { error: 'El salario minimo no puede ser mayor que el maximo' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const item = await repo.createSalaryRange(parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo rango salarial',
      entity: 'rango salarial',
      entityId: item.id,
      detail: item.vacancyId,
    });
    revalidatePath('/dashboard/rango-salarial');
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/salary-ranges POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
