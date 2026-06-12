import { getRepo } from '@/lib/data/repository';
import { CatalogsPage } from './catalogs-page';

export const metadata = { title: 'Catálogos' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [seniorities, hiringManagers, recruiters, areas, productTypes] =
    await Promise.all([
      repo.listCatalog('seniorities'),
      repo.listCatalog('hiring-managers'),
      repo.listCatalog('recruiters'),
      repo.listEngagementAreas(),
      repo.listMerchProductTypes(),
    ]);
  return (
    <CatalogsPage
      initialSeniorities={seniorities}
      initialHiringManagers={hiringManagers}
      initialRecruiters={recruiters}
      initialAreas={areas}
      initialProductTypes={productTypes}
    />
  );
}
