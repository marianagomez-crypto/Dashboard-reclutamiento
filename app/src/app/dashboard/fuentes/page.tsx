import { getRepo } from '@/lib/data/repository';
import { SourcesPage } from './sources-page';
import {
  SourceCostByVacancyChart,
  type SourceCostRow,
} from '@/components/dashboard/charts';

export const metadata = { title: 'Fuentes' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [sources, vacancies, recruiters, hiringManagers] = await Promise.all([
    repo.listSources(),
    repo.listVacancies(),
    repo.listCatalog('recruiters'),
    repo.listCatalog('hiring-managers'),
  ]);
  // Combina reclutadores + hiring managers para el select de Responsable.
  // Dedup por nombre. Algunos heads pueden ser owners de fuentes (ej. Jorge Morales).
  const ownerOptions = Array.from(
    new Map(
      [...recruiters, ...hiringManagers].map((p) => [p.name, p.name]),
    ).keys(),
  );

  // ---- Dataset para el chart de costos por vacante ----
  const vacanciesById = new Map(vacancies.map((v) => [v.id, v]));
  const costAcc = new Map<string, SourceCostRow>();
  const channelSet = new Set<string>();
  for (const s of sources) {
    if (!s.vacancyId) continue;
    const cost = s.monthlyCost || 0;
    if (cost <= 0) continue;
    const v = vacanciesById.get(s.vacancyId);
    const row =
      costAcc.get(s.vacancyId) ||
      ({
        vacancyId: s.vacancyId,
        vacancyTitle: v?.title || s.vacancyId,
        total: 0,
        byChannel: {},
      } as SourceCostRow);
    row.total += cost;
    row.byChannel[s.name] = (row.byChannel[s.name] || 0) + cost;
    channelSet.add(s.name);
    costAcc.set(s.vacancyId, row);
  }
  const costByVacancy = Array.from(costAcc.values());
  const channels = Array.from(channelSet).sort();

  return (
    <>
      <SourcesPage
        initialSources={sources}
        vacancies={vacancies}
        ownerOptions={ownerOptions}
      />
      <div className="mt-6">
        <SourceCostByVacancyChart data={costByVacancy} channels={channels} />
      </div>
    </>
  );
}
