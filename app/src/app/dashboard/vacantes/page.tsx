import { getRepo } from '@/lib/data/repository';
import { VacanciesPage } from './vacancies-page';

export const metadata = { title: 'Vacantes' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [vacancies, candidates] = await Promise.all([
    repo.listVacancies(),
    repo.listCandidates(),
  ]);
  return <VacanciesPage initialVacancies={vacancies} candidates={candidates} />;
}
