import { getRepo } from '@/lib/data/repository';
import { PipelineTable, type PipelineRow } from '@/components/dashboard/pipeline-table';
import { MovementsTable } from '@/components/dashboard/movements-table';
import { STAGES, type Stage, type StageMovement } from '@/lib/types';

export const metadata = { title: 'Pipeline' };
export const dynamic = 'force-dynamic';

// Orden jerarquico del pipeline (de izquierda a derecha).
const VISIBLE_STAGES: Stage[] = [
  'Screening',
  'Entrevista T&C',
  'Entrevista líder',
  'Prueba Tecnica',
  'Oferta',
];

// Rank de cada etapa visible (Screening=0, ..., Oferta=4).
const STAGE_RANK: Record<string, number> = Object.fromEntries(
  VISIBLE_STAGES.map((s, i) => [s, i]),
);

// Dada la lista de movimientos de un candidato, devuelve la etapa MAS AVANZADA
// segun el orden del pipeline, ignorando etapas fuera de VISIBLE_STAGES y
// el orden cronologico de insercion.
function mostAdvancedStage(movs: StageMovement[]): Stage | null {
  let best: Stage | null = null;
  let bestRank = -1;
  for (const m of movs) {
    const rank = STAGE_RANK[m.stage];
    if (rank !== undefined && rank > bestRank) {
      bestRank = rank;
      best = m.stage as Stage;
    }
  }
  return best;
}

export default async function PipelinePage() {
  const repo = await getRepo();
  const [candidates, vacancies, movements] = await Promise.all([
    repo.listCandidates(),
    repo.listVacancies(),
    repo.listStageMovements(),
  ]);

  // Solo vacantes Abiertas — indexadas por ID para join rapido
  const openVacancies = new Map(
    vacancies.filter((v) => v.status === 'Abierta').map((v) => [v.id, v]),
  );

  // Indice de movimientos por candidato para lookup O(1) en el map de abajo.
  const movementsByCandidate = new Map<string, StageMovement[]>();
  for (const m of movements) {
    if (!m.candidateId) continue;
    const list = movementsByCandidate.get(m.candidateId);
    if (list) list.push(m);
    else movementsByCandidate.set(m.candidateId, [m]);
  }

  const rows: PipelineRow[] = candidates
    .filter((c) => c.finalStatus === 'En proceso')
    .filter((c) => c.vacancyId && openVacancies.has(c.vacancyId))
    .map((c) => {
      const v = openVacancies.get(c.vacancyId!)!;

      // La etapa a sombrear sale de la tabla Etapas: la mas avanzada segun
      // el orden del pipeline (Screening → Oferta). Si no hay movimientos
      // validos para este candidato/vacante, caemos al campo "Etapa Actual".
      const candidateMovs = (movementsByCandidate.get(c.id) || []).filter(
        (m) => !m.vacancyId || m.vacancyId === c.vacancyId,
      );
      const fromMovements = mostAdvancedStage(candidateMovs);
      const stage: Stage = fromMovements ?? (c.stage as Stage);

      return {
        candidateId: c.id,
        name: c.name,
        vacancyId: v.id,
        vacancyTitle: v.title,
        stage,
      };
    })
    // Excluye candidatos cuya etapa efectiva no esta en las 5 visibles
    // (ej. los que ya pasaron a "Ingreso").
    .filter((r) => VISIBLE_STAGES.includes(r.stage))
    // Ordena por orden del pipeline (Screening → Oferta), luego por nombre
    .sort((a, b) => {
      const ai = STAGES.indexOf(a.stage);
      const bi = STAGES.indexOf(b.stage);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Vista tipo tablero — cada candidato en la etapa donde se encuentra.
        </p>
      </div>
      <PipelineTable rows={rows} />

      <MovementsTable
        initialMovements={movements}
        candidates={candidates}
        vacancies={vacancies}
      />
    </div>
  );
}
