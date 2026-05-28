import { getRepo } from '@/lib/data/repository';
import { ReviewTimesPage } from './review-times-page';

export const metadata = { title: 'Tiempo de revisión' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [reviewTimes, candidates, hiringManagers] = await Promise.all([
    repo.listReviewTimes(),
    repo.listCandidates(),
    repo.listCatalog('hiring-managers'),
  ]);
  return (
    <ReviewTimesPage
      initialReviews={reviewTimes}
      candidates={candidates}
      headOptions={hiringManagers.map((h) => h.name)}
    />
  );
}
