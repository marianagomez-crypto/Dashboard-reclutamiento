import { getRepo } from '@/lib/data/repository';
import { PipelineTable, type PipelineRow } from '@/components/dashboard/pipeline-table';
import { MovementsTable } from '@/components/dashboard/movements-table';
import { STAGES, type Stage } from '@/lib/types';

export const metadata = { title: 'Pipeline' };
export const dynamic = 'force-dynamic';

const VISIBLE_STAGES: Stage[] = [
  'Screening',
  'Entrevista T&C',
  'Entrevista líder',
  'Prueba Tecnica',
  'Oferta',
];

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

  const rows: PipelineRow[] = candidates
    .filter((c) => c.finalStatus === 'En proceso')
    .filter((c) => c.vacancyId && openVacancies.has(c.vacancyId))
    .filter((c) => VISIBLE_STAGES.includes(c.stage as Stage))
    .map((c) => {
      const v = openVacancies.get(c.vacancyId!)!;
      return {
        candidateId: c.id,
        name: c.name,
        vacancyId: v.id,
        vacancyTitle: v.title,
        stage: c.stage as Stage,
      };
    })
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
