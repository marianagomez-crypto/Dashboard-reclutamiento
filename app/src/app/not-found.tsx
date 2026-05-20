import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-brand-aqua-700" />
      <div className="absolute inset-0 -z-10 mesh-brand opacity-50" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-10" />
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 text-white">
        <Logo variant="mark" size={64} />
        <h1 className="font-display text-6xl font-bold">404</h1>
        <p className="max-w-md text-center text-white/80">
          La pagina que buscas no existe o fue movida.
        </p>
        <Button asChild variant="gradient">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
