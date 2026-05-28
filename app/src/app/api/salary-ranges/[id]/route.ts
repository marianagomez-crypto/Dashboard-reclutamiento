import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  vacancyId: z.string().trim().min(1).optional(),
  min: z.number().nonnegative().nullable().optional(),
  max: z.number().nonnegative().nullable().optional(),
  status: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  if (
    typeof parsed.data.min === 'number' &&
    typeof parsed.data.max === 'number' &&
    parsed.data.min > parsed.data.max
  ) {
    return NextResponse.json(
      { error: 'El salario minimo no puede ser mayor que el maximo' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const item = await repo.updateSalaryRange(params.id, parsed.data as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo rango salarial',
      entity: 'rango salarial',
      entityId: item.id,
    });
    revalidatePath('/dashboard/rango-salarial');
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/salary-ranges PATCH]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo actualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteSalaryRange(params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino rango salarial',
      entity: 'rango salarial',
      entityId: params.id,
    });
    revalidatePath('/dashboard/rango-salarial');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/salary-ranges DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
