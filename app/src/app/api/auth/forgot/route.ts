import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';

export const runtime = 'nodejs';

const schema = z.object({ email: z.string().email() });

// Stub de recuperacion de contrasena. En produccion debe enviar email con token.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Correo invalido' }, { status: 400 });
  }
  const repo = await getRepo();
  const user = await repo.getUserByEmail(parsed.data.email);
  // Siempre OK para no filtrar si el correo existe
  if (user) {
    await repo.logActivity({
      userId: user.id,
      userName: user.name,
      action: 'solicito recuperacion de contrasena',
      entity: 'sistema',
    });
  }
  return NextResponse.json({
    ok: true,
    message:
      'Si el correo existe, recibiras instrucciones para restablecer tu contrasena.',
  });
}
