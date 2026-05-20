import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'recruiter', 'viewer']),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  active: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const repo = await getRepo();
  const list = await repo.listUsers();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
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
  try {
    const u = await repo.createUser(parsed.data);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo un usuario',
      entity: 'usuario',
      entityId: u.id,
      detail: u.email,
    });
    return NextResponse.json({ data: u }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
