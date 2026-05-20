import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { setSessionCookie, signSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(1, 'Contrasena requerida'),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  const repo = await getRepo();
  const user = await repo.getUserByEmail(parsed.data.email);
  if (!user || !user.active || !user.passwordHash) {
    return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  }

  const ok = bcrypt.compareSync(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  await repo.recordLogin(user.id);
  await repo.logActivity({
    userId: user.id,
    userName: user.name,
    action: 'inicio sesion',
    entity: 'sistema',
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
