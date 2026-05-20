import { LoginForm } from './login-form';
import { AuthShell } from '../auth-shell';

export const metadata = { title: 'Iniciar sesion' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <AuthShell>
      <LoginForm from={searchParams.from} />
    </AuthShell>
  );
}
