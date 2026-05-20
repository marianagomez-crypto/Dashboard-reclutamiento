import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/data/repository';
import { env } from '@/lib/env';
import { SettingsPage } from './settings-page';

export const metadata = { title: 'Ajustes' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getSession();
  const repo = await getRepo();
  const health = await repo.health();

  return (
    <SettingsPage
      session={session!}
      source={repo.source()}
      health={health}
      appName={env.app.name}
    />
  );
}
