import { getRepo } from '@/lib/data/repository';
import { AdminPage } from './admin-page';

export const metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const users = await repo.listUsers();
  return <AdminPage initialUsers={users} />;
}
