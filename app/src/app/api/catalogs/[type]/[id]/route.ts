import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import type { CatalogType } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_TYPES: CatalogType[] = ['seniorities', 'hiring-managers', 'recruiters'];

function isValidType(t: string): t is CatalogType {
  return (VALID_TYPES as string[]).includes(t);
}

const patchSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido'),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  if (!isValidType(params.type)) {
    return NextResponse.json({ error: 'Tipo de catalogo invalido' }, { status: 400 });
  }
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

  try {
    const repo = await getRepo();
    const item = await repo.updateCatalogItem(
      params.type,
      params.id,
      parsed.data.name,
    );
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo entrada en catalogo',
      entity: params.type,
      entityId: item.id,
      detail: item.name,
    });
    return NextResponse.json({ data: item });
  } catch (err: any) {
    console.error('[api/catalogs PATCH]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo actualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  if (!isValidType(params.type)) {
    return NextResponse.json({ error: 'Tipo de catalogo invalido' }, { status: 400 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  try {
    const repo = await getRepo();
    await repo.deleteCatalogItem(params.type, params.id);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'elimino entrada en catalogo',
      entity: params.type,
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/catalogs DELETE]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo eliminar' },
      { status: 500 },
    );
  }
}
