import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import {
  DROP_REASONS,
  FINAL_STATUSES,
  FUENTES,
  STAGES,
} from '@/lib/types';

export const runtime = 'nodejs';

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  vacancyId: z.string().optional(),
  source: z.enum(FUENTES as unknown as [string, ...string[]]).optional(),
  recruiter: z.string().optional(),
  stage: z.enum(STAGES as unknown as [string, ...string[]]).optional(),
  finalStatus: z
    .enum(FINAL_STATUSES as unknown as [string, ...string[]])
    .optional(),
  dropReason: z
    .enum(DROP_REASONS as unknown as [string, ...string[]])
    .nullable()
    .optional(),
  hired: z.boolean().optional(),
  // Fecha en la que se realizo la etapa (no se persiste en el candidato,
  // se usa para el movimiento auto-generado en la tabla Etapas).
  stageDate: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const repo = await getRepo();
  const c = await repo.getCandidate(params.id);
  if (!c) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: c });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
  // stageDate es auxiliar — no es campo del candidato, lo separamos del patch.
  const { stageDate, ...candidatePatch } = parsed.data;

  try {
    const repo = await getRepo();
    // Leemos la etapa anterior ANTES de actualizar, para detectar el cambio.
    const before = await repo.getCandidate(params.id);
    const c = await repo.updateCandidate(params.id, candidatePatch as any);
    await repo.logActivity({
      userId: session.sub,
      userName: session.name,
      action: 'actualizo un candidato',
      entity: 'candidato',
      entityId: c.id,
      detail: candidatePatch.stage ? `etapa -> ${candidatePatch.stage}` : undefined,
    });

    // Auto-registrar movimiento en el pipeline si la etapa REALMENTE cambio.
    // La fecha viene del calendario (stageDate); fallback a hoy. No rompe la
    // respuesta si algo falla (la edicion del candidato ya tuvo efecto).
    if (candidatePatch.stage && before && before.stage !== c.stage) {
      const movDate = stageDate || new Date().toISOString().slice(0, 10);

      // Si la nueva etapa es MAS AVANZADA, cerrar el movimiento abierto de la
      // etapa anterior con Fecha Fin = fecha de inicio de la nueva etapa.
      const newRank = STAGES.indexOf(c.stage);
      const oldRank = STAGES.indexOf(before.stage);
      if (newRank > oldRank) {
        try {
          const movs = await repo.listStageMovements(c.id);
          const prevOpen = movs
            .filter((m) => m.stage === before.stage && !m.endedAt)
            .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
          if (prevOpen) {
            await repo.updateStageMovement(prevOpen.id, { endedAt: movDate });
          }
        } catch (closeErr) {
          console.error('[api/candidates PATCH] cierre de etapa anterior fallo', closeErr);
        }
      }

      // Crear el movimiento de la nueva etapa con Fecha Inicio = movDate.
      try {
        await repo.createStageMovement({
          candidateId: c.id,
          vacancyId: c.vacancyId || '',
          stage: c.stage,
          startedAt: movDate,
          comments: `Cambio de etapa: ${before.stage} → ${c.stage}`,
        });
      } catch (mErr) {
        console.error('[api/candidates PATCH] movimiento auto fallo', mErr);
      }
    }

    return NextResponse.json({ data: c });
  } catch (err: any) {
    console.error('[api/candidates PATCH]', err);
    return NextResponse.json(
      { error: err?.message || 'No se pudo actualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.role !== 'admin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const repo = await getRepo();
  await repo.deleteCandidate(params.id);
  await repo.logActivity({
    userId: session.sub,
    userName: session.name,
    action: 'elimino un candidato',
    entity: 'candidato',
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
