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

const createSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido'),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string } },
) {
  if (!isValidType(params.type)) {
    return NextResponse.json({ error: 'Tipo de catalogo invalido' }, { status: 400 });
  }
  try {
    const repo = await getRepo();
    const data = await repo.listCatalog(params.type);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/catalogs GET]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo listar' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } },
) {
  if (!isValidType(params.type)) {
    return NextResponse.json({ error: 'Tipo de catalogo invalido' }, { status: 400 });
  }
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
    const item = await repo.createCatalogItem(params.type, parsed.data.name);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: `creo entrada en catalogo`,
      entity: params.type,
      entityId: item.id,
      detail: item.name,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/catalogs POST]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo crear' },
      { status: 500 },
    );
  }
}
