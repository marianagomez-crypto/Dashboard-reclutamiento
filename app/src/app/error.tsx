'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-card-elevated">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-destructive">
          Error inesperado
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
          Algo se rompió en esta sección.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes reintentar o volver al dashboard. Si el problema persiste, revisa la
          consola del navegador (F12) para ver el detalle del error.
        </p>
        {error?.message && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-muted px-3 py-2 text-xs text-foreground/80">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => reset()} variant="gradient">
            <RotateCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard')} variant="outline">
            <Home className="h-4 w-4" />
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
