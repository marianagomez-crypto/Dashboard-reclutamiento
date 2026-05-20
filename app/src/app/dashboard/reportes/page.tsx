import { getRepo } from '@/lib/data/repository';
import { ReportsPage } from './reports-page';

export const metadata = { title: 'Reportes' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [candidates, vacancies] = await Promise.all([
    repo.listCandidates(),
    repo.listVacancies(),
  ]);
  return <ReportsPage candidates={candidates} vacancies={vacancies} />;
}
