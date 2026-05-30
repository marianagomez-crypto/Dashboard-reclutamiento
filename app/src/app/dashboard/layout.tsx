import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Sidebar } from './_components/sidebar';
import { Topbar } from './_components/topbar';
import { ShellTransition } from './_components/shell-transition';
import { RoleProvider } from '@/components/auth/role-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <RoleProvider role={session.role}>
      <div className="relative flex min-h-screen overflow-x-hidden">
        <Sidebar role={session.role} />
        {/* min-w-0 evita que los hijos flex empujen el contenedor mas alla
            del viewport cuando tienen contenido ancho (tablas, charts, etc). */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Topbar session={session} />
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
            <ShellTransition>{children}</ShellTransition>
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
