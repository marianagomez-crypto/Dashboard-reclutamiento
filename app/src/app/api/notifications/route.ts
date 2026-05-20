import { NextRequest, NextResponse } from 'next/server';
import { getRepo } from '@/lib/data/repository';

export const runtime = 'nodejs';

export async function GET() {
  const repo = await getRepo();
  const list = await repo.listNotifications();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const { action, id } = (await req.json().catch(() => ({}))) as {
    action?: string;
    id?: string;
  };
  const repo = await getRepo();
  if (action === 'read-all') {
    await repo.markAllNotificationsRead();
  } else if (action === 'read' && id) {
    await repo.markNotificationRead(id);
  }
  return NextResponse.json({ ok: true });
}
