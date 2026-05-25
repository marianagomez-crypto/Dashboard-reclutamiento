import { getRepo } from '@/lib/data/repository';
import { VacanciesPage } from './vacancies-page';

export const metadata = { title: 'Vacantes' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [vacancies, candidates, seniorities, hiringManagers, recruiters] =
    await Promise.all([
      repo.listVacancies(),
      repo.listCandidates(),
      repo.listCatalog('seniorities'),
      repo.listCatalog('hiring-managers'),
      repo.listCatalog('recruiters'),
    ]);
  return (
    <VacanciesPage
      initialVacancies={vacancies}
      candidates={candidates}
      seniorities={seniorities}
      hiringManagers={hiringManagers}
      recruiters={recruiters}
    />
  );
}
