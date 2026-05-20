import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: { id: s.sub, email: s.email, name: s.name, role: s.role },
  });
}
