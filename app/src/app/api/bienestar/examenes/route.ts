import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const examSchema = z.object({
  collaboratorId: z.string().trim().min(1, 'Colaborador requerido'),
  collaboratorName: z.string().trim().min(1, 'Nombre requerido'),
  examDate: z.string().trim().nullable().optional(),
  sede: z.string().trim().nullable().optional(),
  status: z.string().trim().nullable().optional(),
  resultado: z.string().trim().nullable().optional(),
});

export async function GET() {
  try {
    const repo = await getRepo();
    const data = await repo.listMedicalExams();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[api/bienestar/examenes GET]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo listar' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role === 'viewer')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Datos invalidos' },
      { status: 400 },
    );
  }

  try {
    const repo = await getRepo();
    const d = parsed.data;
    const item = await repo.createMedicalExam({
      collaboratorId: d.collaboratorId,
      collaboratorName: d.collaboratorName,
      examDate: d.examDate || undefined,
      sede: d.sede || undefined,
      status: d.status || undefined,
      resultado: d.resultado || undefined,
    });
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'creo examen medico',
      entity: 'bienestar-examen',
      entityId: item.id,
      detail: item.collaboratorName,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err: any) {
    console.error('[api/bienestar/examenes POST]', err);
    return NextResponse.json({ error: err?.message || 'No se pudo crear' }, { status: 500 });
  }
}
