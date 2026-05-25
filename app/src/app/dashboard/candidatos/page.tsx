import { getRepo } from '@/lib/data/repository';
import { CandidatesPage } from './candidates-page';

export const metadata = { title: 'Candidatos' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [candidates, vacancies, recruiters] = await Promise.all([
    repo.listCandidates(),
    repo.listVacancies(),
    repo.listCatalog('recruiters'),
  ]);
  return (
    <CandidatesPage
      initialCandidates={candidates}
      vacancies={vacancies}
      recruiters={recruiters}
    />
  );
}
