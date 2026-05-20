import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function RootPage() {
  const s = await getSession();
  redirect(s ? '/dashboard' : '/login');
}
