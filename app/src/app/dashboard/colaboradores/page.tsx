import { getRepo } from '@/lib/data/repository';
import { ColaboradoresPage } from './colaboradores-page';

export const metadata = { title: 'Colaboradores' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [participants, areas] = await Promise.all([
    repo.listEngagementParticipants(),
    repo.listEngagementAreas(),
  ]);
  return (
    <ColaboradoresPage
      initialColaboradores={participants}
      areaOptions={areas.map((a) => a.name)}
    />
  );
}
