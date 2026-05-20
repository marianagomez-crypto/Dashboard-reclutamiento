import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const patchSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'recruiter', 'viewer']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }
  const repo = await getRepo();
  const u = await repo.updateUser(params.id, parsed.data);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'actualizo un usuario',
    entity: 'usuario',
    entityId: u.id,
  });
  return NextResponse.json({ data: u });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  if (session.sub === params.id)
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta' },
      { status: 400 },
    );
  const repo = await getRepo();
  await repo.deleteUser(params.id);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'elimino un usuario',
    entity: 'usuario',
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
