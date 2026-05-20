import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Sidebar } from './_components/sidebar';
import { Topbar } from './_components/topbar';
import { ShellTransition } from './_components/shell-transition';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="relative flex min-h-screen">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col lg:pl-72">
        <Topbar session={session} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <ShellTransition>{children}</ShellTransition>
        </main>
      </div>
    </div>
  );
}
