import { AuthShell } from '../auth-shell';
import { ForgotForm } from './forgot-form';

export const metadata = { title: 'Recuperar contrasena' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotForm />
    </AuthShell>
  );
}
