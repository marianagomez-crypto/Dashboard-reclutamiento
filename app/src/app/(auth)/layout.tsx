import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (s) redirect('/dashboard');
  return <>{children}</>;
}
